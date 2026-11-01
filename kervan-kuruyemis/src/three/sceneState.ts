/** Mutable, per-frame scene values shared between the camera rig, GSAP timelines and meshes. */
export const sceneState = {
  /** 0 = sign unlit, 1 = fully lit */
  signPower: 0,
  /** LED sweep reveal 0..1 (left → right) */
  signReveal: 0,
  /** 0 closed .. 1 open — automatic doors follow camera proximity */
  doorOpen: 0,
  /** forced door open (intro/tour) */
  doorForce: 0,
  /** interior light level 0..1 */
  interior: 1,
};
