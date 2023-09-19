import { useEffect, useState } from 'react';
import './App.css';
import azleLogo from './assets/azle_logo.svg';
import azleShadow from './assets/azle_shadow.png';
import { backend } from './declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent, Identity} from '@dfinity/agent';
import { idlFactory } from './declarations/backend';
import { canisterId, createActor } from "./declarations/backend"


let authClientStore: AuthClient | null = null;

 async function handleAuthenticated(authClient: AuthClient) {
  const identity = (await authClient.getIdentity()) as unknown as Identity;
  const backend_actor = createActor(canisterId as string, {
    agentOptions: {
      identity,
    },
  });
  return backend_actor;
 };

 
function App() {
  const [count, setCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  // Get the current counter value
  const fetchCount = async () => {
    try {
      setLoading(true);
      const count = await backend.get();
      setCount(+count.toString()); // Convert BigInt to number
      if(authClientStore?.isAuthenticated()){
      setLogged(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const displayMessage = (message: string): void=>{
  console.log(`${message}`);
   document.querySelector('.card')?.insertAdjacentHTML('afterbegin',`<h3 id="msg">${message}</h3>`);
   setTimeout(()=>{
    document.getElementById('msg')?.remove();
   },2500)
}

//  const notLogged = async ()=>{
//   const isAuth = await authClientStore?.isAuthenticated();
//   if(!isAuth){
//    displayMessage('You Must Log in')
//    return true;
//   }else return false;
//  };

 const login = async () => {
  const authClient = await AuthClient.create();
  const isLocalNetwork = process.env.DFX_NETWORK == 'local';
  const identityProviderUrl = isLocalNetwork ? 
      `http://127.0.0.1:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}` : 
      'https://identity.ic0.app/';
  authClient.login({
    identityProvider: identityProviderUrl,
    maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
    onSuccess: async () => {
      authClientStore = authClient;    
      setLogged(true);
      //  identity = await authClientStore.getIdentity();

      //  const actor = Actor.createActor(idlFactory, {
      //   agent: new HttpAgent({
      //     identity,
      //   }),
      //   canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
      // });
      
      
      

      

    },
  });

};

const logout = async () =>{
  await authClientStore?.logout();
  setLogged(false)
}

// const createActor = async () =>{
//   const identity = await authClientStore?.getIdentity()
//      const actor =  Actor.createActor(idlFactory, {
//       agent: new HttpAgent({
//         identity,
//       }),
//       canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
//     });
//     return actor;
// }

const updateMetadata = async (event: any) =>{
    event.preventDefault();
    if(!logged){
      displayMessage("You must be an active member logged in");
      return;
    }
    let meta = event.target.closest('form').querySelector('input').value
    typeof meta !== 'string' && (meta = JSON.stringify(meta))
    console.log(meta);
    //  const result = await backend.updateMetaObj(meta);
    //  const identity = await authClientStore?.getIdentity()
    //  console.log(identity?.getPrincipal().toString())
    //  const actor =  Actor.createActor(idlFactory, {
    //   agent: new HttpAgent({
    //     identity,
    //   }),
    //   canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
    // });

    const identity = (await authClientStore?.getIdentity()) as unknown as Identity;
    const backend_actor = createActor(canisterId as string, {
    agentOptions: {
      identity,
    },
  });

    const result = await backend_actor.updateMetaObj(meta);
    console.log(result)
     if(result){
      displayMessage('Successfully updated metadata')
     }else {console.log('smth happn ')}
  }

const seeAll = async ()=>{
    const result =  await backend.seeUsers();
    console.log(result)
    if(result.length>0 ){
      document.getElementById('root')?.insertAdjacentHTML('beforeend',`<h3> ${result}</h3>`)
     }else displayMessage('Not yet registered users');

  }

const setNewMember = async (event: any)=>{
    event.preventDefault();
    if(!logged){
      displayMessage('You must log in to become a Member =)')
      return;}
    const userName =event.target.closest('form').querySelector('input').value;

    const identity = await authClientStore?.getIdentity()
    console.log(identity?.getPrincipal().toString());
     const actor =  Actor.createActor(idlFactory, {
      agent: new HttpAgent({
        identity,
      }),
      canisterId: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
    });  

    // const exist = await backend.seeMyUser();
    const exist: any = await actor.seeMyUser();
    console.log(exist);
    if (exist.length > 0){
      displayMessage('You are already a registered member')
      return;
    }
    // await backend.setUser(userName);
    await actor.setUser(userName);
    displayMessage(`Yey!! Welcome to our community   ${userName}!!!!`);
  };

const addToCount =async (e: any) => {
  if(loading)return;
  e.preventDefault();
  const sum =BigInt(+ e.target.closest('form').querySelector('input').value); 
  console.log(sum);
  try {
    setLoading(true);
    // await backend.add(sum); // Increment the count by argument
    await fetchCount(); // Fetch the new count
    
  } finally {
    setLoading(false);
  }

}


  const increment = async () => {// only if authenticated
    if (loading) return; // Cancel if waiting for a new count
    if(!logged){
      displayMessage("You must log in")
      return;}

    try {
        setLoading(true);
        // await backend.inc(); // Increment the count by 1
        await fetchCount(); // Fetch the new count
        
      } finally {
        setLoading(false);
      }

  };


  
 // Fetch the count on page load
  useEffect(() => {
    fetchCount();
  }, []);

  return (
    <div className="App">
      <div className='Nav'>
      <button id='login-btn' onClick={login} style={{ opacity: loading ? 0.5 : 1, display: logged? "none": "inline-block" }}>
          Log in here
        </button>
      <button  onClick={logout} style={{ opacity: loading ? 0.5 : 1, display: logged ? "inline-block":"none"}}>
          Log out
        </button>
      </div>
      <div>
     
        <a
          href="https://github.com/demergent-labs/azle"
          target="_blank"
        >
          <span className="logo-stack">
            <img
              src={azleShadow}
              className="logo azle-shadow"
              alt="azle logo"
            />
            <img src={azleLogo} className="logo azle" alt="Azle logo" />
          </span>
        </a>
        
      </div>
      <h1> I don't Care D.A.O 🫡 </h1>
      <h3> Cnverting useless proposals into a community commitment</h3>
      <div className="card">
        
        <button  onClick={increment} style={{ opacity: loading ? 0.5 : 1 }}>
          Voting Supply {count}
        </button>
        <form>
          <input type='text' placeholder='username'></input>
          <button type='submit' onClick={setNewMember} style={{ opacity: loading ? 0.5 : 1 }}>
          Become a Member
        </button>
        </form>
        <form>
          <input type='text' placeholder='tell something about you'></input>
          <button type='submit' onClick={updateMetadata} style={{ opacity: loading ? 0.5 : 1 }}>
          Save data
        </button>
        </form>
        <form>
          <input type='text' placeholder='add only if authenticated'></input>
          <button type='submit' onClick={addToCount} style={{ opacity: loading ? 0.5 : 1 }}>
          ADD
        </button>
        </form>
         <button onClick={seeAll} style={{ opacity: loading ? 0.5 : 1 }}>
          see all members
        </button>
      </div>
    
    </div>
  );
}

export default App;
