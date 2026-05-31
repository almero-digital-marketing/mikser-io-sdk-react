// mikser-io-sdk-react
//
// React 18+ / 19+ hooks and router integration for a mikser-io server.
// Pairs with mikser-io-sdk-api — get the entities client from there,
// wrap your tree in <MikserProvider client={c}>, then use the hooks.
//
// This file is a re-export barrel. The actual implementations live in
// ./src — one file per concern:
//
//   src/client.js     MikserProvider, useMikserClient
//   src/documents.js  useDocument, useDocuments
//   src/router.js     useMikserRoutes, generateMikserRoutes
//   src/href.js       HrefIndexProvider, useHref, useAlternates
//   src/asset.js      AssetIndexProvider, useAsset
//
// Each submodule can also be imported directly:
//
//   import { useDocument } from 'mikser-io-sdk-react/src/documents.js'
//
// but the package's public surface is this barrel — the submodule
// paths are not part of the API contract.

export { MikserProvider, useMikserClient }     from './src/client.js'
export { useDocument, useDocuments }           from './src/documents.js'
export { useMikserRoutes, generateMikserRoutes } from './src/router.js'
export { HrefIndexProvider, useHref, useAlternates } from './src/href.js'
export { AssetIndexProvider, useAsset }        from './src/asset.js'
