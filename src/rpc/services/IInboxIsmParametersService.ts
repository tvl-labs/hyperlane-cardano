import { type InboxIsmParametersResponseType } from "../types";

export interface IInboxIsmParametersService {
  getInboxIsmParameters: () => Promise<InboxIsmParametersResponseType>;
}
