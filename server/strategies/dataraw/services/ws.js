import { makeServiceDescriptor } from '../connection.js';
import { connections } from '../../../strategiesTooling.js';

export const handleConnection = makeServiceDescriptor({ service: connections.ws });
