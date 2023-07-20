import "dotenv/config";

import * as OpenApiValidator from "express-openapi-validator";

import express, { type Request, type Response } from "express";
import path from "path";
import http from "http";
import logger from "morgan";
import * as helios from "@hyperionbt/helios";
import type {
  GetValidatorStorageLocationsRequestBody,
  GetValidatorStorageLocationsResponseBody,
  LastFinalizedBlockResponseType,
  MerkleTreeResponseType,
  MessagesByBlockRangeResponseType,
  InboxIsmParametersResponseType,
  IsInboxMessageDeliveredRequestBody,
  IsInboxMessageDeliveredResponseBody,
  EstimateInboxMessageFeeRequestBody,
  EstimateInboxMessageFeeResponseBody,
  SubmitInboundMessageRequestBody,
  SubmitInboundMessageResponseBody,
} from "./types";
import {
  lastFinalizedBlockNumberService,
  merkleTreeService,
  messagesService,
  validatorAnnouncement,
  inboxIsmParameters,
  isInboundMessageDelivered,
  estimateInboundMessageFee,
  submitInboundMessage,
} from "./services/services";
import { IS_MOCK_ENVIRONMENT } from "./environment";
import { mockPrefillState } from "./mock/mockInitializer";
import { Address } from "../offchain/address";
import { MessagePayload } from "../offchain/messagePayload";
import { Wallet } from "../offchain/wallet";

const openapiSpec = path.resolve(__dirname, "..", "openapi.yaml");

const app = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(
  OpenApiValidator.middleware({
    apiSpec: openapiSpec,
    validateRequests: true,
    validateResponses: true,
  })
);

app.use(logger("dev"));
app.use("/spec", express.static(openapiSpec));

app.use((err, req, res, _) => {
  res.status(err.status ?? 500).json({
    message: err.message,
    errors: err.errors,
  });
});

app.get(
  "/api/indexer/lastFinalizedBlock",
  async function (req, res: Response<LastFinalizedBlockResponseType>, _) {
    const response =
      await lastFinalizedBlockNumberService.getLastFinalizedBlockNumber();
    res.status(200).json(response);
  }
);

app.get(
  "/api/indexer/merkleTree",
  async function (req, res: Response<MerkleTreeResponseType>, _) {
    const response = await merkleTreeService.getLatestMerkleTree();
    res.json(response);
  }
);

app.get(
  "/api/indexer/messages/:fromBlock/:toBlock",
  async function (req, res: Response<MessagesByBlockRangeResponseType>, _) {
    const fromBlock = parseInt(req.params.fromBlock);
    const toBlock = parseInt(req.params.toBlock);
    const response = await messagesService.getMessagesInBlockRange(
      fromBlock,
      toBlock
    );
    res.json(response);
  }
);

app.post(
  "/api/validator-announcement/get-storage-locations/",
  async function (
    req: Request<GetValidatorStorageLocationsRequestBody>,
    res: Response<GetValidatorStorageLocationsResponseBody>,
    _
  ) {
    // TODO[RPC]: better request validation, respond with 400 if invalid request body.
    const validatorEvmAddresses = req.body.validatorAddresses.map((address) =>
      Address.fromHex(address)
    );
    const validatorStorageLocations =
      await validatorAnnouncement.getValidatorStorageLocations(
        validatorEvmAddresses
      );
    res.json({
      validatorStorageLocations: validatorStorageLocations.map(
        ({ validatorAddress, storageLocation }) => ({
          storageLocation,
          validatorAddress: validatorAddress.toHex(),
        })
      ),
    });
  }
);

app.get(
  "/api/inbox/ism-parameters",
  async function (req, res: Response<InboxIsmParametersResponseType>, _) {
    const response = await inboxIsmParameters.getInboxIsmParameters();
    res.status(200).json(response);
  }
);

app.post(
  "/api/inbox/is-message-delivered",
  async function (
    req: Request<IsInboxMessageDeliveredRequestBody>,
    res: Response<IsInboxMessageDeliveredResponseBody>,
    _
  ) {
    const isDelivered =
      await isInboundMessageDelivered.getIsInboxMessageDelivered({
        version: req.body.version,
        nonce: req.body.nonce,
        originDomain: req.body.originDomain,
        sender: Address.fromHex(req.body.sender),
        destinationDomain: req.body.destinationDomain,
        recipient: Address.fromHex(req.body.recipient),
        message: MessagePayload.fromHexString(req.body.message),
      });
    res.status(200).json({ isDelivered });
  }
);

// TODO: Better error handling, like when the tx
// fails to build / doesn't validate
app.post(
  "/api/inbox/estimate-message-fee",
  async function (
    req: Request<EstimateInboxMessageFeeRequestBody>,
    res: Response<EstimateInboxMessageFeeResponseBody>,
    _
  ) {
    const feeADA = await estimateInboundMessageFee.estimateInboundMessageFee(
      new Wallet(new helios.Address(req.body.relayerCardanoAddress)),
      {
        origin: req.body.origin,
        originMailbox: Address.fromHex(req.body.originMailbox),
        checkpointRoot: Uint8Array.from(
          Buffer.from(req.body.checkpointRoot, "hex")
        ),
        checkpointIndex: req.body.checkpointIndex,
        message: {
          version: req.body.message.version,
          nonce: req.body.message.nonce,
          originDomain: req.body.message.originDomain,
          sender: Address.fromHex(req.body.message.sender),
          destinationDomain: req.body.message.destinationDomain,
          recipient: Address.fromHex(req.body.message.recipient),
          message: MessagePayload.fromHexString(req.body.message.message),
        },
      },
      req.body.signatures.map((s) => Uint8Array.from(Buffer.from(s, "hex")))
    );
    res.status(200).json({ feeADA });
  }
);

// TODO: Better error handling, like when the tx
// fails to build / doesn't validate
app.post(
  "/api/inbox/submit-message",
  async function (
    req: Request<SubmitInboundMessageRequestBody>,
    res: Response<SubmitInboundMessageResponseBody>,
    _
  ) {
    const txId = await submitInboundMessage.submitInboundMessage(
      new Wallet(
        new helios.Address(req.body.relayerCardanoAddress),
        new helios.PrivateKey(req.body.privateKey)
      ),
      {
        origin: req.body.origin,
        originMailbox: Address.fromHex(req.body.originMailbox),
        checkpointRoot: Uint8Array.from(
          Buffer.from(req.body.checkpointRoot, "hex")
        ),
        checkpointIndex: req.body.checkpointIndex,
        message: {
          version: req.body.message.version,
          nonce: req.body.message.nonce,
          originDomain: req.body.message.originDomain,
          sender: Address.fromHex(req.body.message.sender),
          destinationDomain: req.body.message.destinationDomain,
          recipient: Address.fromHex(req.body.message.recipient),
          message: MessagePayload.fromHexString(req.body.message.message),
        },
      },
      req.body.signatures.map((s) => Uint8Array.from(Buffer.from(s, "hex")))
    );
    res.status(200).json({ txId: txId.hex });
  }
);

const PORT = process.env.PORT ?? 3000;
console.log(
  `Starting RPC on port ${PORT} in ${
    IS_MOCK_ENVIRONMENT ? "mock" : "production"
  } environment`
);
http.createServer(app).listen(PORT);

if (IS_MOCK_ENVIRONMENT) {
  mockPrefillState();
}
