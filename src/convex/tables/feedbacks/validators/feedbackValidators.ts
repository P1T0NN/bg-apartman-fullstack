// LIBRARIES
import { docValidator } from 'convex/server';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';

// SCHEMAS
import { feedbacks } from '../schema.js';

const feedbackDoc = docValidator('feedbacks', feedbacks);

export const feedbackPage = pageValidator(feedbackDoc);
