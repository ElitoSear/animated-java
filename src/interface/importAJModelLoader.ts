import { SvelteComponentDev } from 'svelte/internal'
import { BLUEPRINT_CODEC, IBlueprintFormatJSON } from '../blueprintFormat'
import ImportAjModelLoaderDialog from '../components/importAJModelLoaderDialog.svelte'
import { PACKAGE } from '../constants'
import * as ModelDatFixerUpper from '../systems/modelDataFixerUpper'
import { injectSvelteCompomponent } from '../util/injectSvelteComponent'
import { sanitizePathName } from '../util/minecraftUtil'
import { createModelLoader } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openUnexpectedErrorDialog } from './dialog/unexpectedError'

let activeComponent: SvelteComponentDev | null = null

createModelLoader(`${PACKAGE.name}-upgradeAJModelLoader`, {
	icon: 'upload_file',
	category: 'animated_java',
	name: translate('action.upgrade_old_aj_model_loader.name'),
	condition() {
		return true
	},
	format_page: {
		component: {
			template: `<div id="${PACKAGE.name}-upgradeAJModelLoader-target" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;"></div>`,
		},
	},
	onFormatPage() {
		if (activeComponent) {
			activeComponent.$destroy()
		}
		void injectSvelteCompomponent({
			component: ImportAjModelLoaderDialog,
			props: {},
			elementSelector() {
				return document.querySelector(`#${PACKAGE.name}-upgradeAJModelLoader-target`)
			},
			postMount(el) {
				activeComponent = el
			},
			injectIndex: 2,
		})
	},
})

export function convertAJModelToBlueprint(path: string) {
	try {
		console.log(`Convert .ajmodel: ${path}`)
		const blueprint = ModelDatFixerUpper.process(
			JSON.parse(fs.readFileSync(path, 'utf8'))
		) as IBlueprintFormatJSON

		BLUEPRINT_CODEC.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path,
		})
		blueprint.blueprint_settings!.export_namespace ??= sanitizePathName(Project!.name)

		requestAnimationFrame(() => {
			Project!.save_path = ''
			Project!.export_path = ''
			Project!.openSettings()
		})
	} catch (e) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}
