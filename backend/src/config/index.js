/**
 * Barrel export cho config/ — cùng pattern với repositories/index.js và
 * services/index.js đã có sẵn trong project, để nơi khác chỉ cần
 * import { config, prisma, connectDB, disconnectDB } from '../config/index.js'
 * thay vì nhớ import riêng từng file env.js/database.js.
 */
export { config } from './env.js';
export { default as prisma, connectDB, disconnectDB } from './database.js';
