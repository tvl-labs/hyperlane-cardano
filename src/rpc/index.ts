import "dotenv/config";

import * as OpenApiValidator from "express-openapi-validator";

import express, { type Request, type Response } from "express";
import path from "path";
import http from "http";
import logger from "morgan";
import type {
  DispatchMessageResponseType,
  LastFinalizedBlockResponseType,
  MerkleTreesByBlockNumberResponseType,
  MessagesByBlockRangeResponseType,
  DispatchMessageRequestBody
} from "./types";
import { dispatchNewMessage } from "./mock/mock";
import { convertDispatchMessageRequestBody } from "./conversion/convertDispatchMessageRequestBody";
import {
  lastFinalizedBlockNumberService,
  merkleTreeService,
  messagesService,
} from "./services/services";
import { IS_MOCK_ENVIRONMENT } from "./environment";
import "./mock/mockInitializer";

const openapiSpec = path.resolve(__dirname, "..", "rpc", "openapi.yaml");

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
  "/api/indexer/merkleTrees/:blockNumber",
  async function (req, res: Response<MerkleTreesByBlockNumberResponseType>, _) {
    const blockNumber = parseInt(req.params.blockNumber);
    const response = await merkleTreeService.getMerkleTreesAtBlockNumber(
      blockNumber
    );
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
  "/api/outbox/dispatch",
  async function (
    req: Request<unknown, unknown, DispatchMessageRequestBody>,
    res: Response<DispatchMessageResponseType>,
    _
  ) {
    const outboxDispatchedMessage = convertDispatchMessageRequestBody(req.body);
    const messageId = dispatchNewMessage(outboxDispatchedMessage);
    res.json({ messageId: messageId.hex() });
  }
);

const PORT = process.env.PORT ?? 3000;
console.log(
  `Starting RPC on port ${PORT} in ${
    IS_MOCK_ENVIRONMENT ? "mock" : "production"
  } environment`
);
http.createServer(app).listen(PORT);