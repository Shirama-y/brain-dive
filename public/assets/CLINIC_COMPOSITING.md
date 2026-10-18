# Clinic seating integration

Mode: built-in ImageGen, compositing edit.

Output: `public/assets/clinic-seated-v2.png`

Inputs: `novel-scenes.png` (top-left clinic panel only, environment target) and `patient-seated.png` (supporting original character/pose reference).

This complete scene replaces the old portrait overlay during the clinic sequence. The original assets are preserved.

## Final prompt

Use case: compositing. Asset type: original visual-novel game scene, one full-frame 16:9 landscape clinic illustration, no text or UI. Input image 1 is a 2x2 environment atlas: use ONLY its TOP LEFT clinic panel as the environment edit target; ignore the other three panels completely. Input image 2 is the supporting patient identity/pose reference. Create the occupied version of exactly that clinic, preserving the camera perspective, dark navy bookshelves on the left, amber lamps, blinds behind, desk on the right, carpet and furniture. Seat the same original weary Japanese man age 28, messy black hair, gray office shirt, loosened dark tie and dark trousers in the existing BACK CENTER upholstered armchair, approximately at 54 percent horizontal position, facing slightly toward the desk at the right. His scale MUST match that armchair and room: head near 35 percent frame height, hips resting directly on the chair cushion around 65 percent height, feet grounded on the carpet around 90 percent height. Keep the foreground left chair empty. Integrate his weight into the upholstery, proper sitting anatomy, contact shadows under hips and shoes, coherent occlusion of armrests, same fine pixel-dither detail as the room. Crucially remove the reference portrait's magenta studio rim light, glowing halo and cutout appearance: relight his skin, shirt and hair in muted navy ambient shadow with restrained warm amber light from the actual room lamps and blinds. His contrast, sharpness, grain and saturation must match the background. No separate portrait overlay, no oversized figure, no floating chair or feet, no extra chair, no other person, no glowing outline. Preserve the existing calm clinic mood and original character identity. Full-bleed single clinic scene, not an atlas or collage.

