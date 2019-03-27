# shifu
Shifu is for providing simulation based training on any of your web app

## Build Hack
1. Copy index.d.ts from ``node_modules/popper.js/index.d.ts`` to  ``node_modules/@types/popper.js/index.d.ts`` 

## Dev Instructions

* Fork the repository at:- https://github.com/visualbis/shifu.git

* Clone the forked respository
```
$ git clone https://github.com/<your_username>/shifu.git
```

* Setup upstream to fetch updates from the official respository i.e visualbis/shifu.git
```
$ git remote add upstream https://github.com/visualbis/shifu.git
```

* fetch updates and merge upstream/master with local/master or appropriate branch
```
$ git fetch upstream
$ git checkout master
$ git merge upstream/master
```

## Build Instructions

* Install Dependencies
```
$ npm install
```

* For Development Build
```
$ npm run dev
```

* TypeScript Compilation during Development
```
$ npm run type-check:watch
```

* For Production Build
```
$ npm run prod
```

* The build will be available in `dist/` directory


Have fun!
