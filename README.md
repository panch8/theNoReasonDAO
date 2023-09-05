# The no reason DAO 

## Guide lines throughout this project.

This project is backed ontop of the [Vite-React-Azle](https://github.com/Code-and-State/typescript-bootcamp/tree/main/templates/vite-react-azle) template. First of all i want to extend my greetings to @seb and all the @code&state team. 
Through out the next commits i'll be improving the features and functionalities. 

This project is called "The No Reason DAO" because right now has no usefull functionalities but pretends to be the backbone of next personal projects were the intention of building a real and usefull dao is achieved.

### Features included

This implementation, by the time of writing, is capable of:

- Log in with Internet Identity. 
- Set a logged in user as a member of the current DAO. 
- Newbie Members of the DAO receive 1 Voting Power which enables the posibility to make proposals and to vote on propoasl as well.
- 
## Getting started

Make sure that [Node.js](https://nodejs.org/en/) `>= 16.x` and [`dfx`](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove) `>= 0.14.3Beta-0` are installed on your system.

Run the following commands:
```sh
dfx start --clean --background # Run dfx in the background
npm run setup # Install packages, deploy canisters, and generate type bindings
npm start # Start the development server
```

## Technology Stack

- [Vite](https://vitejs.dev/): high-performance tooling for front-end web development
- [React](https://reactjs.org/): a component-based UI library
- [TypeScript](https://www.typescriptlang.org/): JavaScript extended with syntax for types
- [Sass](https://sass-lang.com/): an extended syntax for CSS stylesheets
- [Prettier](https://prettier.io/): code formatting for a wide range of supported languages
- [Azle](https://github.com/demergent-labs/azle): a TypeScript CDK for the Internet Computer

## Documentation

- [Vite developer docs](https://vitejs.dev/guide/)
- [React quick start guide](https://beta.reactjs.org/learn)
- [Internet Computer docs](https://internetcomputer.org/docs/current/developer-docs/ic-overview)
- [Azle Book](https://demergent-labs.github.io/azle/)
- [`dfx.json` reference schema](https://internetcomputer.org/docs/current/references/dfx-json-reference/)

## Tips and Tricks

- Customize your project's code style by editing the `.prettierrc` file and then running `npm run format`.
- Reduce the latency of update calls by passing the `--emulator` flag to `dfx start`.
- Split your frontend and backend console output by running `npm run frontend` and `npm run backend` in separate terminals.
