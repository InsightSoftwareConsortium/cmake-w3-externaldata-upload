# cmake-w3-externaldata-upload

## Development

- Clone the repository:

```sh
git clone https://github.com/InsightSoftwareConsortium/cmake-w3-externaldata-upload
cd cmake-w3-externaldata-upload
```

- Change to this directory and install dependencies

```sh
cd cmake-w3-externaldata-upload
npm install --location=global pnpm
pnpm install
```

- Run the dev server

```sh
pnpm dev
```

- Test registration / file upload

**Note: building and serving are required to test login/registration**

```sh
pnpm build
pnpm preview
```
