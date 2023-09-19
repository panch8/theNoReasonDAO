import { $query, $update, nat,Principal,Record, StableBTreeMap, text, Vec, ic, Opt, Variant, match, Tuple, Result } from 'azle';


let votingSupply : nat = BigInt(0);
let startTimes: Vec<Tuple<Times>> = [];
let expTimes: Vec<Tuple<Times>> = [];
let finishIds: Vec<nat> = [];


type Times = Tuple<[nat,nat]>

type User= Record<{
    id: Principal,
    userName: text,
    metadata: text,
    votingPower: nat,
    votedProposalsId: Vec<nat>,
    proposals: Vec<nat>
}>
type Status = Variant<{
    pending: null,
    onVoting: null,
    finish: null,
    accepted:null,
    rejected: null        
}>;

type Proposal = Record<{
    id: nat,
    issuer: Principal,
    iat: nat,
    start:nat,
    exp: nat,
    title: text,
    description: text,
    status: Status,
    voteYes: nat,
    voteNo: nat,
    participation: nat
}>

let userDb = new StableBTreeMap<Principal, User>(0,50,1_000);
let proposalsDb = new StableBTreeMap<nat, Proposal>(1,20,10_000)


//Users logic
$update;
export function setUser(userName:text): Result<User,text> {
   return match(userDb.get(ic.caller()),{
        Some: (user)=>{
            return {Err: `This user is already registered under the username: ${user.userName}`}
        },
        None: ()=>{
            const user = {
                id: ic.caller(),
                userName: userName,
                metadata: '',
                votingPower: BigInt(1),
                votedProposalsId: [],
                proposals: []
            }
            userDb.insert(ic.caller(), user)
            inc();
            return {Ok: user};

        }
    })
}


$query;
export function seeUsers(): Vec<User>{
    return userDb.values()
}


$query;
export function seeMyUser(): Opt<User>{
    return userDb.get(ic.caller())
}

$query;
export function seeOneUser(id: text): Opt<User>{
    const selectedUser = userDb.get(Principal.fromText(id));
    return selectedUser;
}

$update;
export function updateMetaObj(metaDataObj : text): boolean {
    const userToBeUpdated = userDb.get(ic.caller());
  
    if(userToBeUpdated.Some !== undefined){
        userToBeUpdated.Some.metadata = metaDataObj;
        userDb.insert(ic.caller(),userToBeUpdated.Some)
        console.log('user updated');
        return true;
    } else {
        console.log('something went wrong');
        return false;
    }

}

//manca
$update;
export function deleteMyUser():boolean{
    return match(userDb.remove(ic.caller()),{
        Some: ()=> {
            dec();
            return true},
        None: ()=> false
    })

}





///////////////////// PROPOSALS /////////////////////

$query;
export function seeProposals ():Vec<Proposal>{
    const proposals = proposalsDb.values()
    return proposals;
}

$query;
export function getProposalById(id:nat): Opt<Proposal>{
    return proposalsDb.get(id);
}



$query;
export function getProposalByStatus(status: Status): Opt<Vec<Proposal>>{
        const propsArr = Array.from(proposalsDb.values());
        console.log(propsArr,'arrr',proposalsDb.values());
        const propsByStatus = propsArr.filter((item)=>{
            return JSON.stringify(item.status) === JSON.stringify(status);
        })
        if(propsByStatus.length === 0){ return Opt.None}
   return Opt.Some(propsByStatus)
};
    
$update;
export function submitProposal(title: text, description: text, gotVoting: nat, expiration: nat): Proposal {
 return match(userDb.get(ic.caller()),{
     Some: (user)=>{
        //time in seconds
        const newProposal: Proposal = {
            id: proposalsDb.len() + BigInt(1),
            issuer: user.id,
            iat: ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000),
            start: gotVoting,
            exp: expiration,
            title: title,
            description: description,
            status: { pending: null},
            voteYes: 0n,
            voteNo: 0n,
            participation: 0n


        }
      if(newProposal.iat < newProposal.start && newProposal.start < newProposal.exp ){
       
        user.proposals.push(newProposal.id);
        userDb.insert(user.id,user);
        
        const start_time: Times = [newProposal.start, newProposal.id]
        const exp_time: Times = [newProposal.exp, newProposal.id]
        startTimes.push(start_time);
        expTimes.push(exp_time);
        proposalsDb.insert(newProposal.id, newProposal)
        return newProposal
      }else{
     
        newProposal.description = `iat: ${newProposal.iat}, start time: ${newProposal.start}, or expiration: ${newProposal.exp} time not correspond`
        newProposal.status = {rejected:null};
        return newProposal
    }
    
    },
    None: ()=>{ic.trap('it is not allowed to submit a proposal if you are not a member, please register as a member first.')
    }
 })

}

$update;
export function changeStatus(id:nat): void {
    match(proposalsDb.get(id), {
        Some: (proposal) => {
         switch (JSON.stringify(proposal.status)) {
            case "{\"pending\":null}":
                if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000)> proposal.start){
                proposal.status = {onVoting:null};
                startTimes.splice(startTimes.indexOf([proposal.start, proposal.id]),1);
                };
            case "{\"onVoting\":null}":
                if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000)> proposal.exp){
                proposal.status = {finish:null};
                finishIds.push(proposal.id);
                expTimes.splice(expTimes.indexOf([proposal.exp, proposal.id]),1);
                };
                break;
            case "{\"finish\":null}":
                if(proposal.participation>0){
                    if(proposal.voteYes>proposal.voteNo){
                        proposal.status = {accepted:null}
                    }else proposal.status = {rejected:null} ;
                }else{
                    proposal.status = {rejected:null};
                    proposal.description = `Proposal rejected due to no participation`
                };
                finishIds.splice(finishIds.indexOf(proposal.id),1);

                break;
     
            };
          proposalsDb.insert(id,proposal); 
        },
        None: () => { console.log(`Proposal with id: ${id} does not exist`);}
    })
   
}

$update;
export function voteOnProposal(id:nat, vote:boolean): Result<text, text> {
    const user = userDb.get(ic.caller());
    
    if(user.Some){
        if(user.Some.votedProposalsId.includes(id)){
            return {
                Err:`You have already casted a vote for proposal id: ${id}` }
        }
        return match(proposalsDb.get(id), {
            Some: (proposal) => {
                if(JSON.stringify(proposal.status)==="{\"onVoting\":null}"){
                    if(vote === true){ 
                        proposal.voteYes += BigInt(1);
                        proposal.participation += BigInt(1);
                    }
                    else {
                        proposal.voteNo += BigInt(1);
                        proposal.participation += BigInt(1);
                    }
                    proposalsDb.insert(id,proposal);
                    user.Some.votedProposalsId.push(id);
                    userDb.insert(ic.caller(),user.Some);
                    return { Ok:` Your vote was successfully casted to the proposal: ${id}`}
                }return { Err: `This proposal is not available for voting. Current Status: ${JSON.stringify(proposal.status)}`}
            },
            None: ()=>{
                return {
                    Err:`No proposal listed with id: ${id}`
                }
            }
        })
    }else {
            return { Err: "not a registered user, please become a member" }
        
    }
}








///////////////////////// VOTING SUPPLY ////////////////////
$query;
export function get(): nat {
    return votingSupply;
}

$query;
export function getIcTimeSeconds(): nat {
    return ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000);
}
//when a new user is registered increment voting supply

function inc(): nat {
    votingSupply += BigInt(1);
    return votingSupply
}

// when user is deleted decrease voting supply

function dec(): nat {
    votingSupply -= BigInt(1);
    return votingSupply
}

$update;
export function tic(): void{
   const initTs = Array.from(startTimes);
   console.log("initTs", initTs.length, initTs);
   initTs.forEach((element)=>{
    if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000) > element[0]){
        changeStatus(element[1]);
    }
   });
   const finishTs = Array.from(expTimes);
   console.log("finishTs", finishTs.length, finishTs);
   finishTs.forEach((element)=>{
    if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000) > element[0]){
        changeStatus(element[1]);
    }
   });
   finishIds.forEach((element)=>{
    console.log("element finish id",element);
    changeStatus(element)
   })
};


