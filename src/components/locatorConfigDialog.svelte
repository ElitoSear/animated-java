<script lang="ts">
	const pluginModeEnabled = !!Project?.animated_java?.enable_plugin_mode

	import { MINECRAFT_REGISTRY } from '../systems/minecraft/registryManager'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import CheckBox from './dialogItems/checkbox.svelte'
	import CodeInput from './dialogItems/codeInput.svelte'
	import LineInput from './dialogItems/lineInput.svelte'

	export let useEntity: Valuable<boolean>
	export let entityType: Valuable<string>
	export let syncPassengerRotation: Valuable<boolean>
	export let summonCommands: Valuable<string>
	export let tickingCommands: Valuable<string>

	const entityTypeValidator: DialogItemValueChecker<string> = (value: string) => {
		if (value.length === 0) {
			return {
				type: 'error',
				message: translate('dialog.locator_config.entity_type.error.empty'),
			}
		} else if (
			!(
				MINECRAFT_REGISTRY.entity_type?.has(value) ||
				MINECRAFT_REGISTRY.entity_type?.has(value.replace(/^minecraft\:/, ''))
			)
		) {
			return {
				type: 'warning',
				message: translate('dialog.locator_config.entity_type.warning.invalid'),
			}
		}
		return { type: 'success', message: '' }
	}
</script>

<div>
	{#if pluginModeEnabled}
		{#each translate('dialog.locator_config.plugin_mode_warning').split('\n') as line}
			<p>{line}</p>
		{/each}
	{:else}
		<CheckBox
			label={translate('dialog.locator_config.use_entity.title')}
			tooltip={translate('dialog.locator_config.use_entity.description')}
			bind:checked={useEntity}
			defaultValue={false}
		/>

		{#if $useEntity}
			<LineInput
				label={translate('dialog.locator_config.entity_type.title')}
				tooltip={translate('dialog.locator_config.entity_type.description')}
				bind:value={entityType}
				valueChecker={entityTypeValidator}
				defaultValue="minecraft:item_display"
			/>

			<CheckBox
				label={translate('dialog.locator_config.sync_passenger_rotation.title')}
				tooltip={translate('dialog.locator_config.sync_passenger_rotation.description')}
				bind:checked={syncPassengerRotation}
				defaultValue={false}
			/>

			<CodeInput
				label={translate('dialog.locator_config.summon_commands.title')}
				tooltip={translate('dialog.locator_config.summon_commands.description')}
				bind:value={summonCommands}
				defaultValue=""
			/>
		{/if}

		<CodeInput
			label={translate('dialog.locator_config.ticking_commands.title')}
			tooltip={translate('dialog.locator_config.ticking_commands.description')}
			bind:value={tickingCommands}
			defaultValue=""
		/>
	{/if}
</div>

<style>
</style>
