import { updateBoundingBox } from '../../blueprintFormat'
import { defaultValues, ExportMode } from '../../blueprintSettings'
import BlueprintSettingsDialogSvelteComponent from '../../components/blueprintSettingsDialog.svelte'
import { PACKAGE } from '../../constants'
import { MinecraftVersion } from '../../systems/global'
import { sanitizePathName } from '../../util/minecraftUtil'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

function getSettings() {
	return {
		blueprintName: new Valuable(Project!.name, value => {
			if (!value) {
				return 'My Blueprint'
			}
			return value
		}),
		textureSizeX: new Valuable(Project!.texture_width),
		textureSizeY: new Valuable(Project!.texture_height),
		showBoundingBox: new Valuable(Project!.animated_java.show_bounding_box),
		autoBoundingBox: new Valuable(Project!.animated_java.auto_bounding_box),
		boundingBoxX: new Valuable(Project!.animated_java.bounding_box[0]),
		boundingBoxY: new Valuable(Project!.animated_java.bounding_box[1]),
		// Export Settings
		enablePluginMode: new Valuable(Project!.animated_java.enable_plugin_mode),
		exportNamespace: new Valuable(Project!.animated_java.export_namespace, value => {
			if (!value) {
				return defaultValues.export_namespace
			}
			return sanitizePathName(value)
		}),
		resourcePackExportMode: new Valuable(
			Project!.animated_java.resource_pack_export_mode as string
		),
		dataPackExportMode: new Valuable(Project!.animated_java.data_pack_export_mode as string),
		targetMinecraftVersions: new Valuable(Project!.animated_java.target_minecraft_versions),
		// Resource Pack Settings
		displayItem: new Valuable(Project!.animated_java.display_item, value => {
			if (!value) {
				return defaultValues.display_item
			}
			return value
		}),
		customModelDataOffset: new Valuable(Project!.animated_java.custom_model_data_offset),
		enableAdvancedResourcePackSettings: new Valuable(
			Project!.animated_java.enable_advanced_resource_pack_settings
		),
		resourcePack: new Valuable(Project!.animated_java.resource_pack),
		// Data Pack Settings
		enableAdvancedDataPackSettings: new Valuable(
			Project!.animated_java.enable_advanced_data_pack_settings
		),
		dataPack: new Valuable(Project!.animated_java.data_pack),
		summonCommands: new Valuable(Project!.animated_java.summon_commands),
		removeCommands: new Valuable(Project!.animated_java.remove_commands),
		tickingCommands: new Valuable(Project!.animated_java.ticking_commands),
		interpolationDuration: new Valuable(Project!.animated_java.interpolation_duration),
		teleportationDuration: new Valuable(Project!.animated_java.teleportation_duration),
		useStorageForAnimation: new Valuable(Project!.animated_java.use_storage_for_animation),
		showFunctionErrors: new Valuable(Project!.animated_java.show_function_errors),
		showOutdatedWarning: new Valuable(Project!.animated_java.show_outdated_warning),
		// Plugin Settings
		bakedAnimations: new Valuable(Project!.animated_java.baked_animations),
		jsonFile: new Valuable(Project!.animated_java.json_file),
	}
}

function setSettings(settings: ReturnType<typeof getSettings>) {
	if (!Project) return
	Project.name = settings.blueprintName.get()

	setProjectResolution(settings.textureSizeX.get(), settings.textureSizeY.get(), true)

	Project.animated_java.show_bounding_box = settings.showBoundingBox.get()
	Project.animated_java.auto_bounding_box = settings.autoBoundingBox.get()
	Project.animated_java.bounding_box = [settings.boundingBoxX.get(), settings.boundingBoxY.get()]

	// Export Settings
	Project.animated_java.enable_plugin_mode = settings.enablePluginMode.get()
	Project.pluginMode.set(settings.enablePluginMode.get()) // Required to update the project title.
	Project.animated_java.export_namespace = settings.exportNamespace.get()
	Project.animated_java.resource_pack_export_mode =
		settings.resourcePackExportMode.get() as ExportMode
	Project.animated_java.data_pack_export_mode = settings.dataPackExportMode.get() as ExportMode
	Project.animated_java.target_minecraft_versions =
		settings.targetMinecraftVersions.get() as MinecraftVersion[]
	// Resource Pack Settings
	Project.animated_java.display_item = settings.displayItem.get()
	Project.animated_java.custom_model_data_offset = settings.customModelDataOffset.get()
	Project.animated_java.enable_advanced_resource_pack_settings =
		settings.enableAdvancedResourcePackSettings.get()
	Project.animated_java.resource_pack = settings.resourcePack.get()
	// Data Pack Settings
	Project.animated_java.enable_advanced_data_pack_settings =
		settings.enableAdvancedDataPackSettings.get()
	Project.animated_java.data_pack = settings.dataPack.get()
	Project.animated_java.summon_commands = settings.summonCommands.get()
	Project.animated_java.remove_commands = settings.removeCommands.get()
	Project.animated_java.ticking_commands = settings.tickingCommands.get()
	Project.animated_java.interpolation_duration = settings.interpolationDuration.get()
	Project.animated_java.teleportation_duration = settings.teleportationDuration.get()
	Project.animated_java.use_storage_for_animation = settings.useStorageForAnimation.get()
	Project.animated_java.show_function_errors = settings.showFunctionErrors.get()
	Project.animated_java.show_outdated_warning = settings.showOutdatedWarning.get()
	// Plugin Settings
	Project.animated_java.baked_animations = settings.bakedAnimations.get()
	Project.animated_java.json_file = settings.jsonFile.get()
	console.log('Successfully saved project settings', Project)
}

export function openBlueprintSettingsDialog() {
	if (!Project) return

	const settings = getSettings()
	return new SvelteDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		width: 700,
		component: BlueprintSettingsDialogSvelteComponent,
		props: settings,
		preventKeybinds: true,
		onConfirm() {
			setSettings(settings)
			updateBoundingBox()
		},
	}).show()
}
