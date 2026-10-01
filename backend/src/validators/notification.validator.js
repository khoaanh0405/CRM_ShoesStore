import { validateParams } from './common.validator.js';
export const notificationValidator = {
  idParam: validateParams('id'),
  customerIdParam: validateParams('customerId'),
};
export default notificationValidator;
