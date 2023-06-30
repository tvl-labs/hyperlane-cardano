/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/api/indexer/lastFinalizedBlock": {
    /** Get the last finalized block */
    get: operations["lastFinalizedBlock"];
  };
  "/api/indexer/merkleTrees/{blockNumber}": {
    /** Retrieve the states of the MerkleTree corresponding to the specified 'blockNumber'. The behavior depends on the number and presence of dispatched messages within the block. - If there are no dispatched messages at 'blockNumber', the method returns the MerkleTree state following the most recent dispatched message from a previous block, or an empty MerkleTree if no prior messages exist. - If there's only a single dispatched message within 'blockNumber', the method returns the MerkleTree state after processing this message. - If 'blockNumber' contains multiple dispatched messages, the method returns the sequence of MerkleTree states corresponding to each dispatched message, in the order of their processing. */
    get: operations["merkleTreesByBlockNumber"];
  };
  "/api/indexer/messages/{fromBlock}/{toBlock}": {
    /** Get messages from fromBlock to toBlock */
    get: operations["messagesByBlockRange"];
  };
}

export type webhooks = Record<string, never>;

export type components = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /** Get the last finalized block */
  lastFinalizedBlock: {
    responses: {
      /** @description Successful operation */
      200: {
        content: {
          "application/json": {
            /** @example 10 */
            lastFinalizedBlock?: number;
          };
        };
      };
    };
  };
  /** Retrieve the states of the MerkleTree corresponding to the specified 'blockNumber'. The behavior depends on the number and presence of dispatched messages within the block. - If there are no dispatched messages at 'blockNumber', the method returns the MerkleTree state following the most recent dispatched message from a previous block, or an empty MerkleTree if no prior messages exist. - If there's only a single dispatched message within 'blockNumber', the method returns the MerkleTree state after processing this message. - If 'blockNumber' contains multiple dispatched messages, the method returns the sequence of MerkleTree states corresponding to each dispatched message, in the order of their processing. */
  merkleTreesByBlockNumber: {
    parameters: {
      path: {
        /** @description Block number to retrieve the MerkleTree */
        blockNumber: number;
      };
    };
    responses: {
      /** @description Successful operation */
      200: {
        content: {
          "application/json": {
            /** @example 5 */
            blockNumber: number;
            merkleTrees: ({
                /** @example 1 */
                count: number;
                branches: (string)[];
              })[];
          };
        };
      };
    };
  };
  /** Get messages from fromBlock to toBlock */
  messagesByBlockRange: {
    parameters: {
      path: {
        /** @description Start block number */
        fromBlock: number;
        /** @description End block number */
        toBlock: number;
      };
    };
    responses: {
      /** @description Successful operation */
      200: {
        content: {
          "application/json": {
            messages: ({
                /** @example 3 */
                block: number;
                message: {
                  version: number;
                  nonce: number;
                  originDomain: number;
                  sender: string;
                  destinationDomain: number;
                  recipient: string;
                  body: string;
                };
              })[];
          };
        };
      };
    };
  };
}
