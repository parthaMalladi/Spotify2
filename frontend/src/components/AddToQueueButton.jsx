import { usePlayer } from "../player/PlayerContext";

// Adds the song to the end of the manual queue, which plays right after the current song.
export default function AddToQueueButton({ song }) {
  const { addToQueue } = usePlayer();
  return (
    <button className="link" onClick={() => addToQueue(song)}>
      Add to queue
    </button>
  );
}
