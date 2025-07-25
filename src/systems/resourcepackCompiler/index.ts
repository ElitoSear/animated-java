import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { getResourcePackFormat } from '../../util/minecraftUtil'
import { IntentionalExportError } from '../exporter'
import { type IRenderedRig } from '../rigRenderer'
import { ExportedFile } from '../util'

import { AJMeta, MinecraftVersion, PackMeta, PackMetaFormats } from '../global'
import _1_20_4 from './1.20.4'
import _1_21_2 from './1.21.2'
import _1_21_4 from './1.21.4'

const VERSIONS = {
	'1.20.4': _1_20_4,
	'1.20.5': _1_20_4,
	'1.21.0': _1_20_4,
	'1.21.2': _1_21_2,
	'1.21.4': _1_21_4,
	'1.21.5': _1_21_4,
	'1.21.6': _1_21_4,
	'1.21.7': _1_21_4,
}

interface ResourcePackCompilerOptions {
	ajmeta: AJMeta
	coreFiles: Map<string, ExportedFile>
	versionedFiles: Map<string, ExportedFile>
	rig: IRenderedRig
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}

export type ResourcePackCompiler = (options: ResourcePackCompilerOptions) => Promise<void>

export interface CompileResourcePackOptions {
	rig: IRenderedRig
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
}

export default async function compileResourcePack(
	targetVersions: MinecraftVersion[],
	options: CompileResourcePackOptions
) {
	const aj = Project!.animated_java

	const ajmeta = new AJMeta(
		PathModule.join(options.resourcePackFolder, 'assets.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace,
		options.resourcePackFolder
	)

	if (aj.resource_pack_export_mode === 'raw') {
		ajmeta.read()
	}

	const globalCoreFiles = new Map<string, ExportedFile>()
	const globalVersionSpecificFiles = new Map<string, ExportedFile>()
	const coreResourcePackFolder = options.resourcePackFolder

	for (const version of targetVersions) {
		console.groupCollapsed(`Compiling resource pack for Minecraft ${version}`)
		const coreFiles = new Map<string, ExportedFile>()
		const versionedFiles = new Map<string, ExportedFile>()

		const versionedResourcePackFolder =
			targetVersions.length > 1
				? PathModule.join(
					options.resourcePackFolder,
					`animated_java_${version.replaceAll('.', '_')}`
				)
				: options.resourcePackFolder

		// Move paths into versioned overlay folders.
		await VERSIONS[version]({
			...options,
			ajmeta,
			coreFiles,
			versionedFiles,
		})

		for (let [path, file] of coreFiles) {
			path = PathModule.join(coreResourcePackFolder, path)
			globalCoreFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.coreFiles.add(path)
		}

		for (let [path, file] of versionedFiles) {
			path = PathModule.join(versionedResourcePackFolder, path)
			globalVersionSpecificFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.versionedFiles.add(path)
		}

		console.groupEnd()
	}

	console.log('Exported files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	// pack.mcmeta
	const packMetaPath = PathModule.join(options.resourcePackFolder, 'pack.mcmeta')
	const packMeta = new PackMeta(
		packMetaPath,
		0,
		[],
		`Animated Java Resource Pack for ${targetVersions.join(', ')}`
	)
	packMeta.read()
	packMeta.pack_format = getResourcePackFormat(targetVersions[0])
	packMeta.supportedFormats = []

	if (targetVersions.length > 1) {
		for (const version of targetVersions) {
			let format: PackMetaFormats = getResourcePackFormat(version)
			packMeta.supportedFormats.push(format)

			const existingOverlay = [...packMeta.overlayEntries].find(
				e => e.directory === `animated_java_${version.replaceAll('.', '_')}`
			)
			if (!existingOverlay) {
				packMeta.overlayEntries.add({
					directory: `animated_java_${version.replaceAll('.', '_')}`,
					formats: format,
				})
			} else {
				existingOverlay.formats = format
			}
		}
	}

	globalCoreFiles.set(PathModule.join(options.resourcePackFolder, 'pack.mcmeta'), {
		content: autoStringify(packMeta.toJSON()),
	})

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'raw') {
		// Clean up old files
		PROGRESS_DESCRIPTION.set('Removing Old Resource Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.previousVersionedFiles.size)

		const removedFolders = new Set<string>()
		for (const file of ajmeta.previousVersionedFiles) {
			if (fs.existsSync(file)) await fs.promises.unlink(file)
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				fs.existsSync(folder) &&
				(await fs.promises.readdir(folder)).length === 0
			) {
				await fs.promises.rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}

		// Write new files
		ajmeta.coreFiles = new Set(globalCoreFiles.keys())
		ajmeta.versionedFiles = new Set(globalVersionSpecificFiles.keys())
		ajmeta.write()

		const exportedFiles = new Map<string, ExportedFile>([
			...globalCoreFiles,
			...globalVersionSpecificFiles,
		])

		PROGRESS_DESCRIPTION.set('Writing Resource Pack...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(exportedFiles.size)
		const createdFolderCache = new Set<string>()

		for (const [path, file] of exportedFiles) {
			const folder = PathModule.dirname(path)
			if (!createdFolderCache.has(folder)) {
				await fs.promises.mkdir(folder, { recursive: true })
				createdFolderCache.add(folder)
			}
			if (file.writeHandler) {
				await file.writeHandler(path, file.content)
			} else {
				await fs.promises.writeFile(path, file.content)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	} else if (aj.resource_pack_export_mode === 'zip') {
		throw new IntentionalExportError('ZIP export is not yet implemented.')
		// exportedFiles.set(
		// 	PathModule.join(options.resourcePackFolder, 'pack.mcmeta'),
		// 	autoStringify({
		// 		pack: {
		// 			// FIXME - This should be a setting
		// 			pack_format: 32,
		// 			description: `${Project!.name}. Generated with Animated Java`,
		// 		},
		// 	})
		// )

		// PROGRESS_DESCRIPTION.set('Writing Resource Pack Zip...')
		// const data: Record<string, Uint8Array> = {}
		// for (const [path, file] of exportedFiles) {
		// 	const relativePath = PathModule.relative(options.resourcePackFolder, path)
		// 	if (typeof file === 'string') {
		// 		data[relativePath] = Buffer.from(file)
		// 	} else {
		// 		data[relativePath] = file
		// 	}
		// }
		// const zipped = await zip(data, {})
		// await fs.promises.writeFile(
		// 	options.resourcePackFolder + (options.resourcePackFolder.endsWith('.zip') ? '' : '.zip'),
		// 	zipped
		// )
	}
}
