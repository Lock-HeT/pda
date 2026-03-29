import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();
import * as path from 'path';
import fs from "fs";

async function main() {
    // 导出Solidity编译输入
    const buildInfoDir = path.join(__dirname, '..', 'artifacts', 'build-info');
    const outputDir = path.join(__dirname, '..', 'deployments', 'solcInputs');
    const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith('.json'));
    console.log(`🔍 Found ${files.length} build-info files. Searching for PDALiquidityManager...`);
    let chosen: any | null = null;

    for (const file of files) {
        const fullPath = path.join(buildInfoDir, file);
        const raw = fs.readFileSync(fullPath, 'utf8');
        try {
            const json = JSON.parse(raw);
            const input = json.input;
            if (input && input.sources && input.sources['contracts/PDALiquidityManager.sol']) {
                chosen = input;
                break;
            }
        } catch {
            // ignore parse error
        }
    }
    console.log(chosen);
    if (chosen) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outPath = path.join(outputDir, 'PDALiquidityManager.json');
        fs.writeFileSync(outPath, JSON.stringify(chosen, null, 2));
        console.log(`   🧾 Solc input exported to: ${outPath}`);
    } else {
        console.warn('   ⚠️  Could not find build-info, skip solcInputs export.');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });