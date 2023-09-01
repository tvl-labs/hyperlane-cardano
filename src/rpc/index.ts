import "dotenv/config";

import * as OpenApiValidator from "express-openapi-validator";

import express, { type Request, type Response } from "express";
import path from "path";
import http from "http";
import logger from "morgan";
import cors from "cors";
import * as helios from "@hyperionbt/helios";
import type {
  EstimateInboxMessageFeeRequestBody,
  EstimateInboxMessageFeeResponseBody,
  GetOutboundGasPaymentRequestBody,
  GetOutboundGasPaymentResponseBody,
  GetValidatorStorageLocationsRequestBody,
  GetValidatorStorageLocationsResponseBody,
  InboxIsmParametersResponseType,
  IsInboxMessageDeliveredResponseBody,
  LastFinalizedBlockResponseType,
  MerkleTreeResponseType,
  MessagesByBlockRangeResponseType,
  SubmitInboundMessageRequestBody,
  SubmitInboundMessageResponseBody,
} from "./types";
import {
  estimateInboundMessageFee,
  getOutboundGasPayment,
  inboxIsmParameters,
  isInboundMessageDelivered,
  lastFinalizedBlockNumberService,
  merkleTreeService,
  messagesService,
  submitInboundMessage,
  validatorAnnouncement,
} from "./services/services";
import { IS_MOCK_ENVIRONMENT } from "./environment";
import { mockPrefillState } from "./mock/mockInitializer";
import { Address } from "../offchain/address";
import { MessagePayload } from "../offchain/messagePayload";
import { Wallet } from "../offchain/wallet";
import { H256 } from "../offchain/h256";
import { getProgramKhalaniTokens } from "../onchain/programs";
import { getOutboxUtxos } from "../offchain/indexer/getOutboxUtxos";
import { getOutboundKhalaniUTxO } from "../offchain/indexer/getOutboundKhalaniUTxO";
import {
  prepareOutboundMessage,
  buildOutboundMessage,
} from "../offchain/tx/createOutboundMessage";
import { getIsmParamsHelios } from "../offchain/inbox";

const openapiSpec = path.resolve(__dirname, "..", "openapi.yaml");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));

app.use(logger("dev"));
app.use("/spec", express.static(openapiSpec));

// TODO: Move this to Khalani App
interface ResponseMph {
  mph: string;
}
app.get("/api/khalani/mph", function (_, res: Response<ResponseMph>, next) {
  try {
    res
      .status(200)
      .json({ mph: getProgramKhalaniTokens().mintingPolicyHash.hex });
  } catch (e) {
    next(e);
  }
});

interface RequestOutbound {
  address: string; // Bech32
  redeemAmount: number;
}
interface ResponseTx {
  tx: string; // CBOR
}
app.post(
  "/api/khalani/buildOutboundTx",
  async function (
    req: Request<RequestOutbound>,
    res: Response<ResponseTx>,
    next
  ) {
    try {
      const outboxAuthToken = process.env.OUTBOX_AUTH_TOKEN ?? "";
      const outboxUtxos = await getOutboxUtxos(outboxAuthToken);
      if (outboxUtxos.length !== 1) {
        throw new Error(
          `Outbox '${outboxAuthToken}' does not exist or is not unique: ${outboxUtxos.length} UTXOs found`
        );
      }
      const outboxUtxo = outboxUtxos[0];
      const wallet = new Wallet(new helios.Address(req.body.address));
      const message = await prepareOutboundMessage(
        outboxUtxo,
        wallet,
        req.body.redeemAmount
      );
      const khalaniUtxo = await getOutboundKhalaniUTxO();
      const tx = await buildOutboundMessage(
        outboxUtxo.utxo,
        message,
        wallet,
        getIsmParamsHelios(),
        khalaniUtxo
      );
      res.status(200).json({ tx: tx.toCborHex() });
    } catch (e) {
      next(e);
    }
  }
);

app.use(
  OpenApiValidator.middleware({
    apiSpec: openapiSpec,
    validateRequests: true,
    validateResponses: true,
  })
);

app.get(
  "/api/indexer/lastFinalizedBlock",
  async function (req, res: Response<LastFinalizedBlockResponseType>, next) {
    try {
      const response =
        await lastFinalizedBlockNumberService.getLastFinalizedBlockNumber();
      res.status(200).json(response);
    } catch (e) {
      next(e);
    }
  }
);

app.get(
  "/api/indexer/merkleTree",
  async function (req, res: Response<MerkleTreeResponseType>, next) {
    try {
      const response = await merkleTreeService.getLatestMerkleTree();
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

app.get(
  "/api/indexer/messages/:fromBlock/:toBlock",
  async function (req, res: Response<MessagesByBlockRangeResponseType>, next) {
    try {
      const fromBlock = parseInt(req.params.fromBlock);
      const toBlock = parseInt(req.params.toBlock);
      const response = await messagesService.getMessagesInBlockRange(
        fromBlock,
        toBlock
      );
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  "/api/validator-announcement/get-storage-locations/",
  async function (
    req: Request<GetValidatorStorageLocationsRequestBody>,
    res: Response<GetValidatorStorageLocationsResponseBody>,
    next
  ) {
    // TODO[RPC]: better request validation, respond with 400 if invalid request body.
    try {
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
    } catch (e) {
      next(e);
    }
  }
);

app.get(
  "/api/inbox/ism-parameters",
  async function (req, res: Response<InboxIsmParametersResponseType>, next) {
    try {
      const response = await inboxIsmParameters.getInboxIsmParameters();
      res.status(200).json(response);
    } catch (e) {
      next(e);
    }
  }
);

app.get(
  "/api/inbox/is-message-delivered/:messageId",
  async function (
    req,
    res: Response<IsInboxMessageDeliveredResponseBody>,
    next
  ) {
    try {
      const isDelivered =
        await isInboundMessageDelivered.getIsInboxMessageDelivered(
          H256.from(Buffer.from(req.params.messageId, "hex"))
        );
      res.status(200).json({ isDelivered });
    } catch (e) {
      next(e);
    }
  }
);

// TODO: Better error handling, like when the tx
// fails to build / doesn't validate
app.post(
  "/api/inbox/estimate-message-fee",
  async function (
    req: Request<EstimateInboxMessageFeeRequestBody>,
    res: Response<EstimateInboxMessageFeeResponseBody>,
    next
  ) {
    try {
      const feeLovelace =
        await estimateInboundMessageFee.estimateInboundMessageFee(
          new Wallet(new helios.Address(process.env.WALLET_ADDRESS ?? "")),
          {
            originMailbox: Address.fromHex(req.body.originMailbox),
            checkpointRoot: H256.fromHex(req.body.checkpointRoot),
            message: {
              version: req.body.message.version,
              nonce: req.body.message.nonce,
              originDomain: req.body.message.originDomain,
              sender: Address.fromHex(req.body.message.sender),
              destinationDomain: req.body.message.destinationDomain,
              recipient: Address.fromHex(req.body.message.recipient),
              body: MessagePayload.fromHexString(req.body.message.message),
            },
          },
          req.body.signatures.map((s) => Buffer.from(s, "hex"))
        );
      res.status(200).json({ feeLovelace });
    } catch (e) {
      next(e);
    }
  }
);

// TODO: Better error handling, like when the tx
// fails to build / doesn't validate
app.post(
  "/api/inbox/submit-message",
  async function (
    req: Request<SubmitInboundMessageRequestBody>,
    res: Response<SubmitInboundMessageResponseBody>,
    next
  ) {
    try {
      const txOutcome = await submitInboundMessage.submitInboundMessage(
        new Wallet(
          new helios.Address(process.env.WALLET_ADDRESS ?? ""),
          new helios.PrivateKey(process.env.WALLET_PRIVATE_KEY ?? "")
        ),
        {
          originMailbox: Address.fromHex(req.body.originMailbox),
          checkpointRoot: H256.fromHex(req.body.checkpointRoot),
          message: {
            version: req.body.message.version,
            nonce: req.body.message.nonce,
            originDomain: req.body.message.originDomain,
            sender: Address.fromHex(req.body.message.sender),
            destinationDomain: req.body.message.destinationDomain,
            recipient: Address.fromHex(req.body.message.recipient),
            body: MessagePayload.fromHexString(
              `0x${req.body.message.message as string}`
            ),
          },
        },
        req.body.signatures.map((s) => Buffer.from(s, "hex"))
      );
      res.status(200).json(txOutcome);
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  "/api/outbox/get-message-gas-payment",
  async function (
    req: Request<GetOutboundGasPaymentRequestBody>,
    res: Response<GetOutboundGasPaymentResponseBody>,
    next
  ) {
    try {
      const totalGasLovelace =
        await getOutboundGasPayment.getOutboundGasPayment(
          new helios.Address(req.body.relayerAddress),
          new helios.ByteArray(req.body.messageId)
        );
      res.status(200).json({ totalGasLovelace });
    } catch (e) {
      next(e);
    }
  }
);

app.use((err, req, res, _) => {
  console.error("Error processing request", err);
  res.status(err.status ?? 500).json({
    message: err.message,
  });
});

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
