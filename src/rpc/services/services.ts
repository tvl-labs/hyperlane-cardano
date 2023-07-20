import { type ILastFinalizedBlockNumberService } from "./ILastFinalizedBlockNumberService";
import { LastFinalizedBlockNumberService } from "./lastFinalizedBlockNumberService";
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
import { ValidatorAnnouncementService } from "./validatorAnnouncementService";
import type { IInboxIsmParametersService } from "./IInboxIsmParametersService";
import { InboxIsmParametersService } from "./inboxIsmParametersService";
import { IsInboxMessageDeliveredService } from "./isInboxMessageDeliveredService";
import { EstimateInboxMessageFeeService } from "./estimateInboxMessageFeeService";
import { SubmitInboundMessageService } from "./submitInboundMessageService";

export let lastFinalizedBlockNumberService: ILastFinalizedBlockNumberService;
export let merkleTreeService: IMerkleTreeService;
export let messagesService: IMessagesService;
export let validatorAnnouncement: IValidatorAnnouncement;
// TODO: Mock these
export let inboxIsmParameters: IInboxIsmParametersService;
export let isInboundMessageDelivered: IsInboxMessageDeliveredService;
export let estimateInboundMessageFee: EstimateInboxMessageFeeService;
export let submitInboundMessage: SubmitInboundMessageService;

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
  inboxIsmParameters = new InboxIsmParametersService();
  isInboundMessageDelivered = new IsInboxMessageDeliveredService();
  estimateInboundMessageFee = new EstimateInboxMessageFeeService();
  submitInboundMessage = new SubmitInboundMessageService();
}
