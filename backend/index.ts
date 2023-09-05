import { $query, $update, nat,Principal,Record, StableBTreeMap, text, Vec, ic, Opt, Variant, match, Tuple, Result } from 'azle';


let votingSupply : nat = BigInt(0);
let startTimes: Vec<Tuple<Times>> = [];
let expTimes: Vec<Tuple<Times>> = [];


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
export function setUser(userName:text): User {
    
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
    return user;
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


//check maybe re-deploy
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
    //time in seconds
    const newProposal: Proposal = {
        id: proposalsDb.len() + BigInt(1),
        issuer: ic.caller(),
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
        console.log(newProposal);
    const start_time: Times = [newProposal.start, newProposal.id]
    const exp_time: Times = [newProposal.exp, newProposal.id]
    startTimes.push(start_time);
    expTimes.push(exp_time);
    proposalsDb.insert(newProposal.id, newProposal)
    console.log("STRTSS",startTimes,"EXPSSS",expTimes);
    return newProposal
    }else{
        console.log(`iat: ${newProposal.iat}, start time: ${newProposal.start}, or expiration: ${newProposal.exp} time not correspond`);

        newProposal.status = {rejected:null};
        return newProposal
    }
    


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
                }

                break;
     
            };
          proposalsDb.insert(id,proposal); 
        },
        None: () => { console.log(`Proposal with id: ${id} does not exist`);}
    })
   
}

$update;
export function voteOnProposal(id:nat, vote:boolean): Result<text, text> {
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
                return { Ok:` Your vote was successfully casted to the proposal: ${id}`}
            }return { Err: `This proposal is not available for voting. Current Status: ${JSON.stringify(proposal.status)}`}
        },
        None: ()=>{
            return {
                Err:`No proposal listed with id: ${id}`
            }
        }
    })
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
   initTs.forEach((element)=>{
    console.log("element", element);
    if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000) > element[0]){
        console.log("enter tic for start, elem: "+ typeof element[1] + element[1]);
        changeStatus(element[1]);
    }
   });
   const finishTs = Array.from(expTimes);
   finishTs.forEach((element)=>{
    console.log('fin elem',element);
    if(ic.time()/BigInt(1000)/BigInt(1000)/BigInt(1000) > element[0]){
        console.log(`enter tic for finish, elem: ${element[1]}`);
        changeStatus(element[1]);
    }
   });
};


