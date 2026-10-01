// LIBRARIES
import { defineApp } from 'convex/server';
import aggregate from '@convex-dev/aggregate/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import r2 from '@convex-dev/r2/convex.config.js';
import auditLog from 'convex-audit-log/convex.config.js';

// COMPONENTS
import betterAuth from './betterAuth/component/convex.config.js';

const app = defineApp();

app.use(betterAuth);
app.use(migrations);
app.use(rateLimiter);
app.use(aggregate, { name: 'accommodationOwnerAggregate' });
app.use(aggregate, { name: 'bookingOwnerAggregate' });
app.use(aggregate, { name: 'userTotalAggregate' });
app.use(aggregate, { name: 'newslettersAggregate' });
app.use(aggregate, { name: 'feedbacksAggregate' });
app.use(aggregate, { name: 'reviewsAggregate' });
app.use(r2);
app.use(auditLog);

export default app;
