<script lang="ts">
  // TODO (Emily): Rewrite component logic to replace AI prototyping
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import defaultArtworkUrl from '../assets/images/vibe.gif';


  export let title = "Nothing";
  export let artist = "";
  export let album = "";
  export let artworkUrl = defaultArtworkUrl.src;
  export let artworkAlt = `Album artwork for ${artist} - ${album}`;
  export let isPlaying = false;
  export let releaseUrl = "";

  const artworkFetchTimeoutMs = 15_000;
  let artworkObjectUrl: string | null = null;
  let artworkRequestId = 0;
  let refreshRequestId = 0;

  function applyNowPlayingState(nextState: {
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    artworkAlt: string;
    isPlaying: boolean;
    releaseUrl: string;
  }) {
    const previousArtworkUrl = artworkObjectUrl;
    const nextArtworkUrl = nextState.artworkUrl;

    title = nextState.title;
    artist = nextState.artist;
    album = nextState.album;
    artworkAlt = nextState.artworkAlt;
    isPlaying = nextState.isPlaying;
    releaseUrl = nextState.releaseUrl;

    artworkUrl = nextArtworkUrl;
    artworkObjectUrl = nextArtworkUrl.startsWith("blob:") ? nextArtworkUrl : null;

    if (previousArtworkUrl && previousArtworkUrl !== artworkObjectUrl) {
      URL.revokeObjectURL(previousArtworkUrl);
    }
  }

  async function loadArtwork(remoteUrl: string) {
    const requestId = ++artworkRequestId;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), artworkFetchTimeoutMs);

    try {
      const response = await fetch(remoteUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Artwork request failed with ${response.status}`);
      }

      const blob = await response.blob();

      if (requestId !== artworkRequestId) {
        return null;
      }

      return URL.createObjectURL(blob);
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
      controller.abort();
    }
  }

  async function refresh() {
    const requestId = ++refreshRequestId;
    const res = await fetch(
      "https://api.listenbrainz.org/1/user/puppyemily/playing-now",
    ).then((res) => res.json());

    if (requestId !== refreshRequestId) {
      return;
    }

    if (!(res?.payload?.playing_now ?? false)) {
      applyNowPlayingState({
        title: "Nothing",
        artist: "No track is currently playing",
        album: "",
        artworkUrl: defaultArtworkUrl.src,
        artworkAlt: "No track is currently playing",
        isPlaying: false,
        releaseUrl: "",
      });
      return;
    }

    const listen = res?.payload?.listens?.[0];
    const track = listen?.track_metadata;

    if (!track) {
      applyNowPlayingState({
        title: "Nothing",
        artist: "A track was recently played...",
        album: "",
        artworkUrl: defaultArtworkUrl.src,
        artworkAlt: "A track was recently played...",
        isPlaying: false,
        releaseUrl: "",
      });
      return;
    }

    const nextTitle = track.track_name ?? "Nothing";
    const nextAlbum = track.track_name === track.release_name ? "" : track.release_name;
    const nextArtist = track.artist_name ?? "";
    const releaseMbid = track.additional_info?.release_mbid;
    const nextReleaseUrl = releaseMbid
      ? `https://musicbrainz.org/release/${releaseMbid}`
      : "";
    const remoteArtworkUrl = releaseMbid
      ? `https://coverartarchive.org/release/${releaseMbid}/front`
      : "";
    const nextArtworkAlt = `Album artwork for ${nextArtist} - ${nextAlbum}`;

    if (!remoteArtworkUrl) {
      applyNowPlayingState({
        title: nextTitle,
        artist: nextArtist,
        album: nextAlbum,
        artworkUrl: defaultArtworkUrl.src,
        artworkAlt: nextArtworkAlt,
        isPlaying: true,
        releaseUrl: nextReleaseUrl,
      });
      return;
    }

    const nextArtworkUrl = (await loadArtwork(remoteArtworkUrl)) ?? defaultArtworkUrl.src;

    if (requestId !== refreshRequestId) {
      if (nextArtworkUrl.startsWith("blob:")) {
        URL.revokeObjectURL(nextArtworkUrl);
      }
      return;
    }

    applyNowPlayingState({
      title: nextTitle,
      artist: nextArtist,
      album: nextAlbum,
      artworkUrl: nextArtworkUrl,
      artworkAlt: nextArtworkAlt,
      isPlaying: true,
      releaseUrl: nextReleaseUrl,
    });
  }

  onMount(() => {
    refresh();
    const timer = window.setInterval(refresh, 50_000);

    return () => window.clearInterval(timer);
  });

  onDestroy(() => {
    if (artworkObjectUrl) {
      URL.revokeObjectURL(artworkObjectUrl);
      artworkObjectUrl = null;
    }
  });
</script>

<article class="card border border-base-300 bg-base-100 shadow-sm">
  <div class="card-body gap-4 p-5">
    <div class="flex items-start justify-between gap-3">
      <h2 class="card-title text-sm font-semibold uppercase tracking-[0.3em] text-base-content/60">
        Now Playing
      </h2>
    </div>

    <a
      class="flex min-w-0 items-center gap-3 rounded-box border border-base-300 bg-base-200/60 p-3"
      href={releaseUrl || undefined}
      target={releaseUrl ? "_blank" : undefined}
      rel={releaseUrl ? "noreferrer" : undefined}
    >
      <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-box bg-base-100">
        {#key artworkUrl}
          <img
            src={artworkUrl}
            alt={artworkAlt}
            class="block h-full w-full object-cover"
            decoding="async"
            transition:fade={{ duration: 600 }}
          />
        {/key}
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-base-content">{title}</p>
        <p class="truncate text-sm text-base-content/75">{artist}</p>
        <p class="truncate text-xs text-base-content/60">{album}</p>
      </div>
    </a>
  </div>
</article>
