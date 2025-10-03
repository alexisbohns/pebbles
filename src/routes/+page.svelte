<script lang="ts">
  import { entriesStore } from '$lib/stores/entriesStore';

  let situation = '';
  let thought = '';
  let emotion = '';
  let behavior = '';
  let alternative = '';

  const addEntry = () => {
    if (!situation || !thought) return;
    entriesStore.add({ situation, thought, emotion, behavior, alternative });
    situation = thought = emotion = behavior = alternative = '';
  };

  // ⚡ Grâce à Svelte, $entriesStore est auto-réactif
  $: entries = $entriesStore;
</script>

<h1>Pebbles 🪨</h1>

<form on:submit|preventDefault={addEntry}>
  <input placeholder="Situation" bind:value={situation} />
  <input placeholder="Pensée automatique" bind:value={thought} />
  <input placeholder="Émotion" bind:value={emotion} />
  <input placeholder="Comportement" bind:value={behavior} />
  <input placeholder="Pensée alternative" bind:value={alternative} />
  <button type="submit">Ajouter</button>
</form>

<h2>Historique</h2>
<ul>
  {#each entries as entry (entry.id)}
    <li>
      <strong>{entry.situation}</strong> → {entry.thought}  
      <br /> {entry.emotion} | {entry.behavior} | {entry.alternative}
      <small> ({new Date(entry.date).toLocaleString()})</small>
      <button on:click={() => entriesStore.remove(entry.id)}>🗑</button>
    </li>
  {/each}
</ul>