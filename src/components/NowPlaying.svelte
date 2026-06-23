<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import defaultArtworkUrl from '../assets/images/vibe.gif';


  export let title = "Nothing";
  export let artist = "";
  export let album = "";
  export let artworkUrl = defaultArtworkUrl.src;
  export let artworkAlt = `Album artwork for ${artist} - ${album}`;
  export let isPlaying = false;

  async function refresh() {
    const res = await fetch(
      "https://api.listenbrainz.org/1/user/puppyemily/playing-now",
    ).then((res) => res.json());

    if (!(res?.payload?.playing_now ?? false)) {
      title = "Nothing";
      artist = "No track is currently playing";
      album = "";
      artworkUrl = defaultArtworkUrl.src;
      artworkAlt = "No track is currently playing";
      isPlaying = false;
      return;
    }

    const listen = res?.payload?.listens?.[0];
    const track = listen?.track_metadata;

    if (!track) {
      title = "Nothing";
      artist = "A track was recently played...";
      album = "";
      artworkUrl = defaultArtworkUrl.src;
      artworkAlt = "A track was recently played...";
      isPlaying = false;
      return;
    }

    title = track.track_name ?? "Nothing";
    album = track.track_name === track.release_name ? "" : track.release_name;
    artist = track.artist_name ?? "";
    artworkUrl = `https://coverartarchive.org/release/${track.additional_info?.release_mbid}/front`;
    artworkAlt = `Album artwork for ${artist} - ${album}`;
    isPlaying = true;
  }

  onMount(() => {
    refresh();
    const timer = window.setInterval(refresh, 50_000);

    return () => window.clearInterval(timer);
  });
</script>

<article class="card border border-base-300 bg-base-100 shadow-sm">
  <div class="card-body gap-4 p-5">
    <div class="flex items-start justify-between gap-3">
      <h2 class="card-title text-sm font-semibold uppercase tracking-[0.3em] text-base-content/60">
        Now Playing
      </h2>
    </div>

    <div class="flex min-w-0 items-center gap-3 rounded-box border border-base-300 bg-base-200/60 p-3">
      <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-box bg-base-100">
        {#key artworkUrl}
          <img
            src={artworkUrl}
            alt={artworkAlt}
            class="block h-full w-full object-cover"
            decoding="async"
            transition:fade={{ duration: 300 }}
            on:error={(ev) => ev.target.src = defaultArtworkUrl.src}
          />
        {/key}
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-base-content">{title}</p>
        <p class="truncate text-sm text-base-content/75">{artist}</p>
        <p class="truncate text-xs text-base-content/60">{album}</p>
      </div>
    </div>
  </div>
</article>
