import { writeFileSync } from 'fs';
import {
  getContractTemplate,
  getSmockHelperTemplate,
  renderNodeMock,
  emptySmockDirectory,
  getSourceUnits,
  smockableNode,
  compileSolidityFilesFoundry,
  renderAbstractUnimplementedFunctions,
  getRemappings,
  getTestImport,
} from './utils';
import path from 'path';
import { ensureDir } from 'fs-extra';
import { exec } from 'child_process';

/**
 * Generates the mock contracts
 * @param mocksDirectory The directory where the mock contracts will be generated
 */
export async function generateMockContracts(
  rootPath: string,
  contractsDirectories: string[],
  mocksDirectory: string,
  ignoreDirectories: string[],
) {
  const mocksPath = path.resolve(rootPath, mocksDirectory);
  await emptySmockDirectory(mocksPath);
  const contractTemplate = getContractTemplate();

  try {
    console.log('Parsing contracts...');

    try {
      const remappings: string[] = await getRemappings(rootPath);
      const testImport = getTestImport(remappings);
      const sourceUnits = await getSourceUnits(rootPath, contractsDirectories, ignoreDirectories, remappings);

      if (!sourceUnits.length) return console.error('No solidity files found in the specified directory');

      for (const sourceUnit of sourceUnits) {
        let importsContent = '';
        // First process the imports, they will be on top of each mock contract
        for (const importDirective of sourceUnit.vImportDirectives) {
          importsContent += await renderNodeMock(importDirective);
        }

        for (const contract of sourceUnit.vContracts) {
          let mockContent = '';
          // Libraries are not mocked
          if (contract.kind === 'library') continue;

          if (contract.abstract) {
            mockContent += await renderAbstractUnimplementedFunctions(contract);
          }

          for (const node of contract.children) {
            if (!smockableNode(node)) continue;
            mockContent += await renderNodeMock(node);
          }

          if (mockContent === '') continue;

          const scope = contract.vScope;
          const sourceContractAbsolutePath = path.resolve(rootPath, sourceUnit.absolutePath);

          // The mock contract is written to the mocks directory, taking into account the source contract's place in the directory structure
          // So if the source is in a subdirectory of the contracts directory, the mock will be in the same subdirectory of the mocks directory
          const escapedSubstrings = contractsDirectories.map((directory) => directory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const regexPattern = new RegExp(escapedSubstrings.join('|'), 'g');
          const mockContractPath = scope.absolutePath
            .replace(regexPattern, path.join(mocksDirectory, path.sep))
            .replace(path.basename(sourceUnit.absolutePath), `Mock${contract.name}.sol`);
          const mockContractAbsolutePath = path.resolve(rootPath, mockContractPath);

          // Relative path to the source is used in mock's imports
          const sourceContractRelativePath = path.relative(path.dirname(mockContractAbsolutePath), sourceContractAbsolutePath);

          const contractCode: string = contractTemplate({
            content: mockContent,
            importsContent: importsContent,
            contractName: contract.name,
            sourceContractRelativePath: sourceContractRelativePath,
            exportedSymbols: Array.from(scope.exportedSymbols.keys()),
            license: sourceUnit.license,
            testImport,
          });

          await ensureDir(path.dirname(mockContractAbsolutePath));
          writeFileSync(mockContractAbsolutePath, contractCode);
        }
      }

      // Generate SmockHelper contract
      const smockHelperTemplate = await getSmockHelperTemplate();
      const smockHelperCode: string = smockHelperTemplate({ testImport });
      writeFileSync(`${mocksPath}/SmockHelper.sol`, smockHelperCode);

      console.log('Mock contracts generated successfully');

      await compileSolidityFilesFoundry(rootPath, mocksDirectory, remappings);

      // Format the generated files
      console.log('Formatting generated files...');
      exec(`forge fmt --root ${rootPath} ${mocksPath}`);
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}
