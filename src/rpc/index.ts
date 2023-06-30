import * as OpenApiValidator from 'express-openapi-validator';

import express, { Response } from 'express'
import path from 'path'
import http from 'http'
import logger from 'morgan'
import {
  LastFinalizedBlockResponseType,
  MerkleTreesByBlockNumberResponseType,
  MessagesByBlockRangeResponseType
} from './types'
import { LastFinalizedBlockNumberService } from './services/lastFinalizedBlockNumber'
import { MerkleTreeService } from './services/merkleTreeService'
import { MessagesService } from './services/messagesService'

const openapiSpec = path.resolve(__dirname, '..', 'rpc', 'openapi.yaml')

const app = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(
  OpenApiValidator.middleware({
    apiSpec: openapiSpec,
    validateRequests: true,
    validateResponses: true
  }),
);

app.use(logger('dev'));
app.use('/spec', express.static(openapiSpec));

app.use((err, req, res, _) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

const lastFinalizedBlockNumber = new LastFinalizedBlockNumberService()
const merkleTreeService = new MerkleTreeService()
const messagesService = new MessagesService()

app.get('/api/indexer/lastFinalizedBlock', async function (req, res: Response<LastFinalizedBlockResponseType>, _) {
  const response = await lastFinalizedBlockNumber.getLastFinalizedBlockNumber()
  res.status(200).json(response)
});

app.get('/api/indexer/merkleTrees/:blockNumber', async function (req, res: Response<MerkleTreesByBlockNumberResponseType>, _) {
  const blockNumber = parseInt(req.params.blockNumber)
  const response = await merkleTreeService.getMerkleTreesByBlockNumber(blockNumber)
  res.json(response)
})

app.get('/api/indexer/messages/:fromBlock/:toBlock', async function (req, res: Response<MessagesByBlockRangeResponseType>, _) {
  const fromBlock = parseInt(req.params.fromBlock)
  const toBlock = parseInt(req.params.toBlock)
  const response = await messagesService.getMessagesInBlockRange(fromBlock, toBlock)
  res.json(response)
})

const PORT = process.env.PORT || 3000
http.createServer(app).listen(PORT);