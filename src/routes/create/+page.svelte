<script lang="ts">
	export let data;
	const templates = data.templates;
</script>

<h1>Créer une entrée</h1>

<ul class="template-list">
  {#each templates as template}
    <li>
      <a href={`/create/${template.name}`}>
        {template.label}
      </a>
    </li>
  {/each}
</ul>
