# Rust API client for cardano-rpc

No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)


## Overview

This API client was generated by the [OpenAPI Generator](https://openapi-generator.tech) project.  By using the [openapi-spec](https://openapis.org) from a remote server, you can easily generate an API client.

- API version: 1.0.0
- Package version: 1.0.0
- Build package: `org.openapitools.codegen.languages.RustClientCodegen`

## Installation

Put the package under your project folder in a directory named `cardano-rpc` and add the following to `Cargo.toml` under `[dependencies]`:

```
cardano-rpc = { path = "./cardano-rpc" }
```

## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*DefaultApi* | [**api_outbox_messages_get**](docs/DefaultApi.md#api_outbox_messages_get) | **GET** /api/outbox/messages | Get all messages from the outbox


## Documentation For Models

 - [Message](docs/Message.md)


To get access to the crate's generated documentation, use:

```
cargo doc --open
```

## Author


