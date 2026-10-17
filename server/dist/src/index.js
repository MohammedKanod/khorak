"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const awc_1 = __importDefault(require("./routes/awc"));
const items_1 = __importDefault(require("./routes/items"));
const stock_1 = __importDefault(require("./routes/stock"));
const dispatches_1 = __importDefault(require("./routes/dispatches"));
const receipts_1 = __importDefault(require("./routes/receipts"));
const thr_1 = __importDefault(require("./routes/thr"));
const hcm_1 = __importDefault(require("./routes/hcm"));
const physicalCount_1 = __importDefault(require("./routes/physicalCount"));
const discrepancies_1 = __importDefault(require("./routes/discrepancies"));
const writeOff_1 = __importDefault(require("./routes/writeOff"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const reports_1 = __importDefault(require("./routes/reports"));
const audit_1 = __importDefault(require("./routes/audit"));
const sync_1 = __importDefault(require("./routes/sync"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
// Generous body limit for offline sync batches and signature/photo payloads
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ONLINE',
        app: 'KHORAK — Supplementary Nutrition Supply Chain Tracker',
        scheme: 'ICDS Gujarat',
        challenge: 'Seva First Innovation Challenge 2026',
        problemStatement: 'PS000052',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/awc', awc_1.default);
app.use('/api/items', items_1.default);
app.use('/api/stock', stock_1.default);
app.use('/api/dispatches', dispatches_1.default);
app.use('/api/receipts', receipts_1.default);
app.use('/api/thr', thr_1.default);
app.use('/api/hcm', hcm_1.default);
app.use('/api/physical-count', physicalCount_1.default);
app.use('/api/discrepancies', discrepancies_1.default);
app.use('/api/write-off', writeOff_1.default);
app.use('/api/alerts', alerts_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/sync', sync_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        error: err.message || 'An unexpected internal server error occurred.',
    });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 KHORAK Server listening on http://localhost:${PORT}`);
        console.log(`📦 Problem Statement PS000052 - Panchmahal District, Gujarat`);
    });
}
exports.default = app;
