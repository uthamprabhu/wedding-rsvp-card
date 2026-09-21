/**
 * Placeholder shown in the chest area until the WebGL scene is actually ready.
 *
 * Covers two gaps that previously left the hero blank:
 *  1. the dynamic import downloading the 3D chunk, and
 *  2. the canvas creating its WebGL context and compiling shaders.
 *
 * Server component — no interactivity, so no JS is shipped for it.
 */

export default function ChestLoader() {
  return (
    <div className="chest-loader" role="status" aria-live="polite">
      <span className="chest-loader-ring" aria-hidden="true">
        <i className="chest-loader-gem" />
      </span>

      <p className="chest-loader-text">Your invitation is arriving</p>

      <span className="chest-loader-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
    </div>
  );
}
