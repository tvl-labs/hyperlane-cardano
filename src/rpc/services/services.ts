import { type ILastFinalizedBlockNumberService } from "./ILastFinalizedBlockNumberService";
import { LastFinalizedBlockNumberService } from "./lastFinalizedBlockNumber";
import { type IMerkleTreeService } from "./IMerkleTreeService";
import { MerkleTreeService } from "./merkleTreeService";
import { type IMessagesService } from "./IMessagesService";
import { MessagesService } from "./messagesService";
import { IS_MOCK_ENVIRONMENT } from "../environment";
import { MockLastFinalizedBlockNumberService } from "../mock/services/MockLastFinalizedBlockNumberService";
import { MockMerkleTreeService } from "../mock/services/MockMerkleTreeService";
import { MockMessagesService } from "../mock/services/MockMessagesService";
import { type IValidatorAnnouncement } from "./IValidatorAnnouncement";
import { MockValidatorAnnouncement } from "../mock/services/MockValidatorAnnouncement";
import { ValidatorAnnouncementService } from "./ValidatorAnnouncementService";

export let lastFinalizedBlockNumberService: ILastFinalizedBlockNumberService;
export let merkleTreeService: IMerkleTreeService;
export let messagesService: IMessagesService;
export let validatorAnnouncement: IValidatorAnnouncement;

if (IS_MOCK_ENVIRONMENT) {
  lastFinalizedBlockNumberService = new MockLastFinalizedBlockNumberService();
  merkleTreeService = new MockMerkleTreeService();
  messagesService = new MockMessagesService();
  validatorAnnouncement = new MockValidatorAnnouncement();
} else {
  lastFinalizedBlockNumberService = new LastFinalizedBlockNumberService();
  merkleTreeService = new MerkleTreeService();
  messagesService = new MessagesService();
  validatorAnnouncement = new ValidatorAnnouncementService();
}
