import { LastFinalizedBlockNumberService } from "./lastFinalizedBlockNumberService";
import { MerkleTreeService } from "./merkleTreeService";
import { MessagesService } from "./messagesService";
import { ValidatorAnnouncementService } from "./validatorAnnouncementService";
import { InboxIsmParametersService } from "./inboxIsmParametersService";
import { IsInboxMessageDeliveredService } from "./isInboxMessageDeliveredService";
import { EstimateInboxMessageFeeService } from "./estimateInboxMessageFeeService";
import { SubmitInboundMessageService } from "./submitInboundMessageService";
import { GetOutboundGasPaymentService } from "./getOutboundGasPaymentService";

export const lastFinalizedBlockNumberService =
  new LastFinalizedBlockNumberService();
export const merkleTreeService = new MerkleTreeService();
export const messagesService = new MessagesService();
export const validatorAnnouncement = new ValidatorAnnouncementService();
export const inboxIsmParameters = new InboxIsmParametersService();
export const isInboundMessageDelivered = new IsInboxMessageDeliveredService();
export const estimateInboundMessageFee = new EstimateInboxMessageFeeService();
export const submitInboundMessage = new SubmitInboundMessageService();
export const getOutboundGasPayment = new GetOutboundGasPaymentService();
