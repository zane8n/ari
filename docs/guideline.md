# A Small Matter of Your Birthday

**Private interactive birthday experience**

*Complete concept, interaction, visual system and technical architecture*

Prepared as the single source of truth for design and development.

- **Target platform:** Vercel-hosted, mobile-first web experience
- **Primary devices:** modern Android/Chrome and iPhone/Safari
- **Status:** concept approved; implementation specification

> **NON-NEGOTIABLE DIRECTION**
>
> The experience must feel intimate, playful and meticulously made for one person. It is not a landing page, survey, slideshow, generic glassmorphism demo or conventional multi-page website. Every visual, word, gesture and transition must belong to the same emotional world.

# How to use this guideline

This document has exactly two governing parts. Part I defines what the recipient must feel, see, read and be able to do. Part II defines how the engineering team must implement, secure, test and deploy it. If an implementation decision conflicts with Part I, Part I wins unless the decision is necessary for accessibility, privacy, security or mobile stability.

| **Part**                         | **Authority**                      | **What it freezes**                                                                                 |
|----------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------|
| Part I - Detailed concept        | Experience and design authority    | Narrative flow, approved copy, visual language, behaviour, motion, tone and emotional pacing.       |
| Part II - Technical architecture | Engineering and delivery authority | Framework, component boundaries, state, data, security, performance, testing and Vercel deployment. |

## Document conventions

- MUST / MUST NOT indicates a release-blocking requirement.

- SHOULD indicates the default implementation; deviation requires a documented reason.

- MAY indicates an optional enhancement that cannot delay or destabilise the core experience.

- Copy marked “preserve wording” is approved content. Developers may only replace bracketed variables and correct implementation escaping; they must not paraphrase it.

- All values in square brackets are configuration variables, not instructions to invent content.

## Required content variables before production

| **Variable**               | **Example format**              | **Rule**                                                                                      |
|----------------------------|---------------------------------|-----------------------------------------------------------------------------------------------|
| RECIPIENT_DEFAULT_NAME     | Optional display fallback       | Leave blank if Isaac does not supply one; the runtime preferred-name answer is authoritative. |
| VACATION_DESTINATION       | City, country or “A surprise”   | Never infer. Configure before the reveal is enabled.                                          |
| VACATION_START             | ISO 8601 date/time with zone    | Required for countdown and invitation card.                                                   |
| VACATION_END               | ISO 8601 date/time with zone    | Required; display in recipient-friendly local format.                                         |
| FINAL_PRIVATE_NOTE         | One short sentence from Isaac   | Must be supplied and reviewed, not generated at runtime.                                      |
| PUBLIC_SITE_ORIGIN         | https://example.com             | Used for metadata, CSP and generated invitation image.                                        |
| INVITE_TOKEN / HOST_SECRET | Cryptographically random values | Generated during provisioning; never committed to source.                                     |

> **NO DEVELOPER ASSUMPTIONS**
>
> If destination, dates or private note are still unavailable, implement the fields as typed configuration with a build-time validation failure. Do not ship guessed copy, placeholder lorem ipsum or a reveal containing square brackets.

**PART I**

# Detailed Concept and Experience Direction

> **EXPERIENCE THESIS**
>
> A private little world slowly recognises her, adopts the colour she chooses, playfully interrogates her birthday wishes, collects useful vacation preferences, asks for a cheeky mutual agreement, and only then reveals the official invitation. The final invitation should feel earned by the journey rather than displayed by a template.

## 1. Product definition

Working title: A Small Matter of Your Birthday. The title is primarily an internal and final-reveal identity. It must not appear as a conventional logo in a navigation bar because there is no navigation bar. The site is a single continuous interactive experience for one intended recipient, with a private host view for Isaac after completion.

### 1.1 Emotional objective

- Make her feel personally seen before asking her for anything.

- Use humour as affectionate tension, not mockery, manipulation or a barrier.

- Let the recipient influence the visual world immediately through her chosen name and colour.

- Move from curiosity to recognition, from recognition to play, from play to sincerity, and from sincerity to a rewarding reveal.

- Finish with the feeling that Isaac planned both the experience and the vacation with care, while still leaving room for her comfort and preferences.

### 1.2 What this experience is not

- Not a questionnaire with a romantic skin.

- Not a scrolling marketing page with sections and a menu.

- Not an explosion of hearts, confetti, glitter, neon gradients or pink birthday clichés.

- Not a dark pattern. Vacation remains a genuine choice; jokes may delay or comment on an option but must not trick her into consent.

- Not visually generic. Default component-library styling, stock icons, default Tailwind palettes and common “glass card on gradient blobs” layouts are prohibited.

## 2. Emotional and interaction arc

| **Phase**   | **Recipient feeling**                | **Interface behaviour**                                                  | **Visual progression**                                    |
|-------------|--------------------------------------|--------------------------------------------------------------------------|-----------------------------------------------------------|
| Arrival     | Curious, slightly amused             | A quiet private welcome asks permission to personalise.                  | Neutral ivory; almost colourless artifacts.               |
| Recognition | Seen and included                    | Name and colour immediately reshape the site.                            | Selected accent washes through surfaces and charms.       |
| Affection   | Valued without being overwhelmed     | A short letter arrives in measured fragments.                            | Glass layers become warmer; motion slows.                 |
| Play        | Amused and involved                  | Birthday choices respond with personality and useful preference capture. | Charms wake up and subtly react to selections.            |
| Trust       | Safe to state what matters           | One sincere free-text question creates room for a boundary or wish.      | Background quiets; fewer moving elements.                 |
| Commitment  | Teased but respected                 | Review, mutual Lover Agreement and signature.                            | Document-like glass sheet; gold seal motif.               |
| Reward      | Surprised, loved, officially invited | The world assembles into a personalised invitation.                      | Chosen colour reaches its fullest, still soft expression. |

## 3. Global experience rules

1.  Present one dominant decision or reading task per scene. Never show the next question below the current one.

2.  Use full-viewport scene transitions, but allow content to scroll naturally when agreement or keyboard height requires it.

3.  Do not show a conventional top bar, hamburger, breadcrumbs or visible step count. Progress is represented by five ambient glass charms that illuminate as stages complete.

4.  Preserve browser Back behaviour before signing. Back returns to the previous scene without losing data. After sealing, Back must not reopen editable answers; it returns to the locked reveal.

5.  Persist draft answers locally so refreshes and mobile browser suspensions do not destroy progress.

6.  Never autoplay music, video or sound. The experience must be complete in silence.

7.  Every joke must resolve within seconds. Nothing may run away forever, block the viewport, or make the interface appear broken.

8.  No interaction may depend only on hover. Android touch is the primary input model; iPhone touch must behave identically.

## 4. Scene-by-scene specification

## Scene 0 - Private arrival

**Purpose.** Establish that this is a private, deliberate experience and create calm curiosity before any form control appears.

**Composition.** Use one centred glass veil, maximum width 31rem, vertically centred within 100dvh. Show one small custom seal icon above the copy and one primary action below. Background artifacts are present but nearly colourless and very slow.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Welcome to the side of the internet that's dedicated to you.  
>   
> Before this little place becomes yours, let it meet you properly.

**Interaction rules.** The action label is “Let it meet me”. On first tap, the veil becomes slightly translucent and transitions into Scene 1. The private invite token must already have been validated server-side; invalid or expired links show a quiet generic unavailable state with no personal details.

**Motion choreography.** Entrance: 420 ms opacity plus 10 px rise. Artifact drift begins after 600 ms. Tap compresses the action by 1.5 percent for 90 ms, then releases into the scene transition. No bouncing.

**State captured.** openedAt is recorded locally immediately and sent as a privacy-minimal server event only when the session endpoint is available. No IP or user-agent is persisted.

**Accessibility/mobile requirement.** Primary button is at least 52 px tall. Initial focus lands on the heading, not the button. Screen reader label identifies this as a private birthday experience without exposing destination or dates.

## Scene 1 - Set the Mood

**Purpose.** Collect the preferred form of address and let the recipient author the visual atmosphere before emotional content begins.

**Composition.** Use two sequential sub-scenes inside one card: name first, then colour. Do not display both as a static form. The name input is large, underlined and surrounded by generous whitespace. Colour is a two-column mobile grid of tactile luxury swatches, each with a name and a soft material preview.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> What should I call you here?

> **COPY - PRESERVE WORDING**
>
> Which colour feels most like you today?

**Interaction rules.** Preferred name is 1-32 Unicode characters after trimming. Permit spaces, accents and apostrophes. Reject markup. Colour selection responds immediately but offers a 700 ms preview before the “Keep this one” action becomes primary. The user may inspect multiple swatches without advancing.

**Motion choreography.** Name confirmation draws a fine line under the entered name. Colour selection launches a radial colour wash from the exact tap coordinate. The wash expands behind content in 720-900 ms using the project’s fluid easing, then surface tint, shadows, icons and active charm settle over the next 220 ms.

**State captured.** preferredName and themeId.

**Accessibility/mobile requirement.** Inputs must be 16 px or larger to prevent iOS zoom. Swatches are real radio inputs with visible focus rings and 48 px minimum targets. Colour names are always visible; meaning must never depend on colour alone.

## Scene 2 - Personal prologue

**Purpose.** Create sincere emotional grounding before the jokes and vacation questions.

**Composition.** Remove visible controls except a subtle “Continue” action that appears only after the final paragraph. Typeset the prologue like an intimate editorial note: large display opening, narrow readable measure, generous rhythm, no quotation marks and no fake handwriting font.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Much better, \[Name\].  
>   
> Now it looks a little more like it belongs to you.

> **COPY - PRESERVE WORDING**
>
> I could have simply sent you another birthday message, but you deserve more than words that eventually disappear into a chat.  
>   
> You have become such a beautiful part of my life—not because everything between us has always been effortless, but because what we have is honest, alive and worth choosing. There is a softness in the way you care, a certainty in the way you love, and a presence that stays with me even across the distance.  
>   
> So I made you this small world: partly to make you smile, partly to remind you how deeply you are loved, and partly because I have a question waiting for you at the end.  
>   
> Happy birthday, my love.  
>   
> Now come and cause some trouble.

**Interaction rules.** Reveal by paragraph rather than character-by-character typing. The recipient controls pacing; do not force a long timer. Continue becomes available once all paragraphs are visible, even if reduced motion is enabled.

**Motion choreography.** Each paragraph fades and rises 8 px with 90 ms stagger; total reveal under 1.2 seconds. While she reads, background velocity drops by 40 percent and cursor/touch reactions weaken to protect attention.

**State captured.** prologueViewedAt.

**Accessibility/mobile requirement.** Text remains selectable. Maintain 45-68 characters per line depending on viewport. Do not animate individual letters, which is slow and noisy for screen readers.

## Scene 3 - The birthday wish trap

**Purpose.** Introduce the playful interrogation and make the vacation path feel discovered rather than announced.

**Composition.** Show the question above four unequal, editorial choice tiles. “A vacation” is visually calm, not pre-highlighted. “Lots of money” gets a small coin-line artifact. Other options use custom letter and moon icons. Keep all options visible within the first comfortable scroll region on 390 x 844 devices.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> What do you actually want for your birthday?

> **COPY - PRESERVE WORDING**
>
> Lots of money

> **COPY - PRESERVE WORDING**
>
> A vacation

> **COPY - PRESERVE WORDING**
>
> A suspiciously long love letter

> **COPY - PRESERVE WORDING**
>
> Peace, sleep and absolutely no responsibilities

**Interaction rules.** Lots of money evades a direct pointer or touch attempt a maximum of three times while remaining inside a bounded safe area. It then settles, becomes unavailable and displays: “Excellent choice. Unfortunately, the finance department is also your boyfriend.” Love letter displays: “Already issued. Non-refundable.” Peace and sleep displays: “Approved during transit. The rest of the birthday remains occupied.” None of those joke responses advances the flow. Vacation opens the confirmation sheet.

**Motion choreography.** Choice tiles lift 2 px on press release. The money tile moves 56-88 px using a 260 ms spring with no overshoot, never crossing another actionable target. On the third attempt it rotates 1.5 degrees, settles and delivers its message. Screen-reader and keyboard activation skip spatial evasion and immediately deliver the same joke.

**State captured.** birthdayWish is only committed as vacation after affirmative confirmation. JokeAttempts records 0-3 locally for deterministic behaviour but need not be submitted.

**Accessibility/mobile requirement.** Use an aria-live="polite" region for joke responses. The moving control must retain focus. Never move it during keyboard focus, reduced motion or when the viewport is below 350 px wide.

## Scene 3A - Vacation confirmation

**Purpose.** Make the reveal playful while preserving real consent.

**Composition.** On mobile, use a bottom sheet with rounded top corners, a dimmed but still colourful backdrop and a small custom suitcase glyph. On larger screens, centre the same content in a compact dialog. The sheet must feel part of the visual system, not like a browser alert.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Are you reaaally sure?  
>   
> You are about to voluntarily travel with the person who made this website.

> **COPY - PRESERVE WORDING**
>
> Yes, take me away

> **COPY - PRESERVE WORDING**
>
> Let me inspect the nonsense again

**Interaction rules.** Affirmation commits vacation and advances. The secondary action closes the sheet and returns focus to the vacation option. Do not invert button positions unexpectedly, hide Cancel or change labels after the dialog opens.

**Motion choreography.** Backdrop fades in 180 ms; sheet rises 22 px and resolves in 360 ms. The suitcase charm tilts once by 4 degrees. Reduced motion uses opacity only.

**State captured.** birthdayWish="vacation" and vacationConfirmedAt.

**Accessibility/mobile requirement.** Implement with Radix Alert Dialog or Dialog semantics, automatic focus trap, labelled title/description and Escape support where a keyboard is present.

## Scene 4 - What being spoiled means

**Purpose.** Collect useful birthday preferences without leaving the playful tone.

**Composition.** Use four soft toggle cards in a one-column layout on narrow screens and a two-by-two grid above 520 px. Selected cards fill with a very pale accent tint and gain a fine inner highlight. Display “Choose as many as feel right.”

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> What does being spoiled properly look like?

> **COPY - PRESERVE WORDING**
>
> A beautiful dinner and dressing up

> **COPY - PRESERVE WORDING**
>
> Slow mornings with no alarms

> **COPY - PRESERVE WORDING**
>
> Little surprises throughout the day

> **COPY - PRESERVE WORDING**
>
> Good food, comfort and disappearing from everyone

**Interaction rules.** Allow one to four selections. Continue is disabled until at least one choice is selected. A second tap deselects. Selection order is not meaningful. If all four are selected, display the quiet aside: “A balanced and financially fearless answer.”

**Motion choreography.** Selected tiles use shared-layout animation: border, icon well and fill interpolate in 220 ms. The related background charm brightens by 10 percent per selection up to a fixed cap; it must not multiply.

**State captured.** spoilModes as an unordered array of stable IDs.

**Accessibility/mobile requirement.** Use checkbox semantics, not buttons with hidden state. Announce selected/unselected state. The disabled Continue action must explain the requirement through nearby text, not only disabled styling.

## Scene 5 - Travel personality

**Purpose.** Identify the desired balance of privacy, exploration, food and spontaneity.

**Composition.** Present four large radio cards, each with one custom abstract illustration rather than a generic travel icon. Use a staggered vertical composition so it feels like browsing moods, not completing a form.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Which version of us are we packing?

> **COPY - PRESERVE WORDING**
>
> Soft, private and slightly luxurious

> **COPY - PRESERVE WORDING**
>
> Exploring during the day, disappearing together at night

> **COPY - PRESERVE WORDING**
>
> Eating our way through the destination

> **COPY - PRESERVE WORDING**
>
> No plan—just questionable decisions made beautifully

**Interaction rules.** Require exactly one answer. Selecting a new answer replaces the previous answer. After selection, show a one-line acknowledgement generated from a fixed copy map; do not use AI-generated text.

**Motion choreography.** The selected illustration resolves from outline to translucent fill; adjacent cards shift no more than 4 px. Background route line subtly redraws toward the selected charm.

**State captured.** travelPersona as one stable enum value.

**Accessibility/mobile requirement.** Use native radio semantics in a fieldset with a legend. The full card is the label. Focus treatment must be visible against every theme.

## Scene 6 - The sincere question

**Purpose.** Give her one quiet place to state a wish, boundary or concern Isaac must not miss.

**Composition.** Reduce background activity and show one frosted note surface with a generous multiline field. Offer a secondary explicit choice beneath it: “Nothing specific. Surprise me.” One of the two paths is required.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> One thing I must not get wrong…

> **COPY - PRESERVE WORDING**
>
> Say anything that would make this feel more comfortable, special or properly yours.

> **COPY - PRESERVE WORDING**
>
> Nothing specific. Surprise me.

**Interaction rules.** Text is optional only when the surprise option is checked. Accept 2-280 characters, preserve line breaks, trim outer whitespace and show a discreet character counter after 220 characters. Never auto-correct her wording. Switching to Surprise me clears the field only after confirmation if text already exists.

**Motion choreography.** The note surface expands with content using layout animation capped at 180 px height before internal scrolling. Background drift drops to 25 percent of normal. On submission, the note folds visually by 6 px into a small glass envelope without hiding the actual value from assistive technology.

**State captured.** mustNotMissText or surpriseMe=true, never both.

**Accessibility/mobile requirement.** Textarea is at least 120 px tall and 16 px text. Keep the primary action above the software keyboard using normal document flow, not a fixed overlay. Escape or browser Back preserves entered text.

## Scene 7 - Review before agreement

**Purpose.** Give the recipient a real final opportunity to inspect and change every choice before the lock.

**Composition.** Display a compact “Your suspiciously official answers” card. Each answer is a labelled row with a custom edit glyph that returns to the relevant scene. Do not use a dense table. The selected colour appears as a small material chip beside its name.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Before the paperwork, make sure this is the version of the story you meant to tell.

> **COPY - PRESERVE WORDING**
>
> Everything looks suspiciously accurate

**Interaction rules.** Every answer is editable here. Returning from an edit comes back to Review. The agreement cannot be opened until all validation passes. This is the last stage where edits are allowed, but nothing is locked until signature is submitted successfully.

**Motion choreography.** Rows enter with 55 ms stagger. Editing uses a reverse scene transition that communicates return without feeling like an error. The ambient charms align more neatly around the review card.

**State captured.** reviewedAt is set when the agreement action is chosen.

**Accessibility/mobile requirement.** Each edit action has an accessible label such as “Edit preferred colour”. Do not rely on a pencil icon alone.

## Scene 8 - The Official Birthday Lover Agreement

**Purpose.** Convert the collected choices into a funny, reciprocal moment of commitment without becoming controlling or legally serious.

**Composition.** Render the agreement as a tall frosted-vellum sheet inside the coloured world. Use an editorial document hierarchy, generous margins and a gold seal marker. On mobile it scrolls as normal page content; it must not be trapped inside a short nested scroll box.

**Approved on-screen copy — preserve wording and emphasis exactly**

### The Official Birthday Lover Agreement

##### Terms, Conditions & Completely Reasonable Levels of Affection

This agreement is entered into by **[Name]**, hereinafter referred to as **“The Birthday Girl,”** and Isaac, hereinafter referred to as **“The Man Who Clearly Has a Plan.”**

By signing below, both parties agree to the following extremely fair and absolutely non-negotiable terms.

#### The Birthday Girl agrees:

1. To allow herself to be celebrated, complimented and mildly spoiled without launching a full financial investigation.

2. Not to say *“anything is fine”* when there are, in fact, at least six things that are absolutely not fine.

3. That no serious disagreement may begin on an empty stomach. Snacks must first be administered, after which the complaint may be formally resubmitted.

4. To permit spontaneous photographs while retaining the unrestricted right to delete any evidence that could reasonably be described as criminally unflattering.

5. To pack at least one outfit capable of making Isaac temporarily forget the itinerary, the destination and possibly his own name.

6. Not to pretend she is unimpressed when her face has already submitted contradictory evidence.

7. To accept compliments without responding with *“you’re just saying that”* more than twice per compliment.

8. To enjoy herself properly without feeling guilty, checking whether everyone else is okay, or trying to turn her own birthday into a normal working day.

#### The Man Who Clearly Has a Plan agrees:

1. To handle the important matters: reservations, transport, snacks, directions and safely returning The Birthday Girl to civilisation.

2. Not to become an itinerary dictator. Naps, kisses, beautiful views and unexpectedly good food may overrule the schedule.

3. To take approximately forty-seven photographs so that The Birthday Girl may approve one.

4. Not to rush her while getting ready and then mysteriously take longer choosing his own shirt.

5. To carry bags, provide honest outfit opinions and understand that *“I’m almost ready”* is an emotional estimate rather than a legally recognised measurement of time.

6. If lost, to use the phrase *“scenic detour”* for no longer than three minutes before admitting what has happened.

7. To ensure that every surprise remains thoughtful, every plan leaves room for her comfort, and the entire escape still feels like her birthday—not merely a trip he wanted to take.

#### Fine print

Affection may be administered without prior warning.

Dessert may be ordered even when both parties claim to be full.

Minor disagreements about where to eat shall be resolved through hunger levels, persuasive reasoning or whichever person finds the better restaurant first.

This agreement remains valid across time zones, delayed flights, missed turns, sleepy mornings and all suspiciously romantic circumstances.

#### Final warning

Once signed, your choices will be sealed into the **Official Birthday Proposal**.

There will be no edits, no appeals, no pretending you did not read the terms, and absolutely no claiming later that this vacation was somehow entirely my idea.

Please sign only if you are prepared to be loved, celebrated and ready to make bad decisions.

**Interaction rules.** At the bottom, show a required acknowledgement checkbox and two actions: “Sign it and make this official” and “I need legal representation”. Legal representation responds: “Legal counsel has reviewed the agreement and strongly recommends accepting the vacation.” It does not sign or advance. The signing action opens the full-screen signing surface. The full agreement text above is canonical and must be stored as one versioned content asset.

**Motion choreography.** The agreement sheet unfurls through mask/clip reveal in 560 ms without simulating paper physics. The gold seal rotates 6 degrees into place. Background becomes almost still. The legal-counsel response slides from behind the seal in 240 ms.

**State captured.** agreementVersion and agreementAcknowledgedAt.

**Accessibility/mobile requirement.** Use semantic headings and ordered lists. Do not require scrolling to the bottom as proof of reading. The explicit checkbox is the acknowledgement. Ensure the long agreement remains readable at 200 percent zoom.

## Scene 9 - Signing and sealing

**Purpose.** Create a ceremonial, tactile commitment and submit the final response safely.

**Composition.** Open a full-screen signing surface on phones to eliminate page-scroll conflict. The top retains a small title and close control; the canvas occupies the central safe area; Clear, Cancel and “Sign and seal it” remain below. Offer a typed-name fallback under “I would rather type my signature.”

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Once you sign, your choices become part of the official birthday proposal. There will be no edits, no appeals and no pretending this was somehow entirely my idea.

> **COPY - PRESERVE WORDING**
>
> Sign and seal it

> **COPY - PRESERVE WORDING**
>
> I would rather type my signature

**Interaction rules.** A drawn signature must contain a minimum path length and cannot be empty. Typed signature must match the entered preferred name loosely after Unicode normalisation, with an explicit override if she signs differently. On submit, keep the draft and signature locally until the encrypted server response confirms success. A network failure shows Retry and does not fake a sealed state. Submission is idempotent.

**Motion choreography.** Signature stroke follows the accent-strong colour with 1.4-2.8 px variable width. Successful server confirmation triggers a bespoke sealing sequence: signature compresses into a line, the gold seal stamps once, the five ambient charms orbit inward, and the invitation card resolves. Total 1.2-1.6 seconds; no generic confetti.

**State captured.** signature type and point data or typed value, consent timestamp, final encrypted response, sealedAt and idempotency key.

**Accessibility/mobile requirement.** Canvas must account for devicePixelRatio and resize without shifting strokes. Set touch-action:none only on the canvas, not the page. Provide Clear, Undo if reliable, typed fallback and descriptive instructions. Vibration is optional Android enhancement only after successful submit and must not be required.

## Scene 10 - Official invitation reveal

**Purpose.** Deliver the emotional and practical reward: a personalised, saveable vacation invitation.

**Composition.** The invitation is the visual synthesis of the entire experience: preferred name, chosen colour, destination, dates, countdown and one private line from Isaac. The selected preference charms orbit at low velocity. Use one strong invitation card, not a dashboard of widgets.

**Approved on-screen copy**

> **COPY - PRESERVE WORDING**
>
> Application suspiciously approved.

> **COPY - PRESERVE WORDING**
>
> \[Name\], I would officially like to take you away for your birthday.

> **COPY - PRESERVE WORDING**
>
> \[VACATION_DESTINATION\]

> **COPY - PRESERVE WORDING**
>
> \[VACATION_DATES\]

> **COPY - PRESERVE WORDING**
>
> \[FINAL_PRIVATE_NOTE\]

**Interaction rules.** Reveal only after confirmed sealing. Provide “Save my invitation” as a real image download generated by the server and a quiet “Read our agreement” action. Do not provide answer editing. A repeat visit with the same invite opens this locked reveal directly and preserves the selected theme.

**Motion choreography.** The card resolves from the converged charms using shared element geometry. Countdown digits crossfade or roll no more than 6 px. Ambient glow reaches full theme strength but never saturates the whole screen. First reveal may take 1.4 seconds; repeat visits enter in 420 ms.

**State captured.** completed state; no new personal answers.

**Accessibility/mobile requirement.** Download action must work in Android Chrome and iOS Safari. If direct download is restricted on iOS, open the generated image in a new same-origin view with clear “press and hold to save” guidance.

## 5. Visual design system

> **VISUAL THESIS**
>
> Warm editorial minimalism meets translucent, softly coloured digital materials. Glass is used as hierarchy and depth, not as a gimmick. The page should feel expensive because it is restrained, aligned and intentional—not because everything glows.

### 5.1 Canvas and material language

- Base canvas: warm ivory, never pure white. Default \#F8F4EC with a subtle 1-1.5 percent monochrome grain overlay generated locally as a tiny data texture or CSS mask.

- Primary ink: \#27231F. Do not recolour body text to the selected accent; contrast and reading comfort remain stable across themes.

- Glass surface: rgba(255,252,247,0.66), backdrop blur 16-20 px, saturation 112-118 percent, 1 px top/edge highlight and low-opacity accent shadow.

- Limit simultaneous heavy backdrop-filter surfaces to three. Nested glass cards should become translucent solid surfaces instead of stacking multiple blurs.

- Corners: 28 px primary mobile cards, 22 px choice cards, 18 px compact controls. Desktop may add 2-4 px, but do not create a pill-only interface.

- Shadows: broad and quiet. Avoid black drop shadows. Use neutral umber at 8 percent plus selected accent at 8-12 percent in the outer halo.

- No visible gradients with obvious endpoints. Use radial fields larger than the viewport and colour-mix tints so the background reads as atmosphere, not a gradient asset.

### 5.2 Selectable colour collection

The recipient chooses a named theme, not an unrestricted colour picker. Every theme must preserve the same ivory, ink and glass foundations. Only accent, accent-strong, accent-soft, glow and artifact tint change. Pink is intentionally absent.

| **Theme ID**   | **Display name** | **Accent** | **Character**                             |
|----------------|------------------|------------|-------------------------------------------|
| emerald        | Emerald          | \#2F7D66   | Rich green with calm clarity              |
| sage           | Sage             | \#7E9C76   | Soft botanical, quiet and airy            |
| forest         | Forest           | \#355E4A   | Deep grounded green                       |
| teal           | Teal             | \#2E7C78   | Balanced blue-green, refined              |
| petrol         | Petrol Blue      | \#2D6673   | Moody, expensive blue-green               |
| cobalt         | Cobalt           | \#4169A1   | Clean vivid blue, deliberately softened   |
| midnight       | Midnight Blue    | \#2E3B59   | Dark, calm and cinematic                  |
| burgundy       | Burgundy         | \#7A3E4D   | Warm wine red without drifting pink       |
| aubergine      | Aubergine        | \#5B405F   | Muted purple-black, intimate              |
| espresso       | Espresso         | \#5A463A   | Warm brown with grounded luxury           |
| onyx           | Onyx             | \#3C4147   | Soft black-charcoal, never absolute black |
| champagne      | Champagne        | \#B99B6B   | Pale warm metallic impression             |
| burnished-gold | Burnished Gold   | \#A98447   | Muted gold with depth                     |
| slate          | Slate            | \#667381   | Cool neutral blue-grey                    |

/\* Runtime theme contract \*/  
:root {  
--canvas: \#f8f4ec;  
--ink: \#27231f;  
--ink-muted: \#6e6861;  
--accent: \#2e7c78; /\* replaced from selected theme \*/  
--accent-strong: color-mix(in oklch, var(--accent) 82%, \#27231f);  
--accent-soft: color-mix(in oklch, var(--accent) 14%, var(--canvas));  
--accent-mist: color-mix(in oklch, var(--accent) 7%, var(--canvas));  
--accent-glow: color-mix(in oklch, var(--accent) 24%, transparent);  
--glass: rgb(255 252 247 / 0.66);  
--hairline: rgb(39 35 31 / 0.10);  
}

Provide precomputed hex/rgba fallbacks before each color-mix declaration. Theme assignment occurs on the root element using data-theme and inline custom properties. The colour wash is visual; the final token switch happens at the start of the wash so no flash occurs after it ends.

### 5.3 Typography

| **Role**            | **Typeface**             | **Mobile specification**                      | **Usage rule**                                                                     |
|---------------------|--------------------------|-----------------------------------------------|------------------------------------------------------------------------------------|
| Display / emotional | Fraunces Variable        | clamp(2.35rem, 8.8vw, 4.4rem); line 0.98-1.04 | Headlines, name moments and reveal only. Use SOFT axis gently; avoid maximum WONK. |
| UI / body           | Manrope Variable         | 16-18 px; line 1.45-1.62                      | All controls, body, agreement and metadata. Inputs never below 16 px.              |
| Signature fallback  | Fraunces Italic          | 28-38 px                                      | Typed signature only. Never use a novelty handwriting font.                        |
| Numbers / countdown | Manrope tabular numerals | 28-42 px                                      | Use font-variant-numeric: tabular-nums to prevent layout shift.                    |

- Load fonts through next/font so they are self-hosted, subset and do not create third-party font requests.

- Headings use slight negative tracking only above 32 px. Body tracking remains normal.

- Agreement body remains Manrope because legibility outranks decorative legal-document mimicry.

- Maximum body measure is 42rem for agreement and 34rem for emotional copy. Centre the block, not every paragraph; long text remains left aligned.

### 5.4 Icons and original artifacts

The visual language requires two icon tiers. Tier 1 is a bespoke set of approximately ten scene icons drawn as SVG: seal, colour drop, letter, coin, moon, dinner setting, route, suitcase, envelope and invitation. Use a 24 x 24 viewBox, 1.5 px rounded strokes, no filled emoji style and a consistent optical weight. Tier 2 may use Phosphor thin/regular icons only for utility actions such as close, edit, clear, download and external/open. Do not mix stroke families in one control.

| **Artifact**    | **Form**                                  | **Behaviour**                           | **Narrative role**             |
|-----------------|-------------------------------------------|-----------------------------------------|--------------------------------|
| Glass pebble    | Irregular rounded translucent shape       | Slow drift and slight pointer repulsion | Represents arrival / calm      |
| Folded ribbon   | Single SVG ribbon with two tonal planes   | Bends 2-3 degrees with pointer          | Represents play / birthday     |
| Halo ring       | Blurred elliptical outline                | Rotates under 2 degrees per second      | Represents affection / focus   |
| Tiny route line | Thin path with two nodes                  | Redraws between travel decisions        | Represents the vacation        |
| Seal charm      | Small imperfect circle with embossed line | Aligns and stamps at signature          | Represents commitment / reveal |

- Never render more than eight independent moving artifact nodes at once on mobile.

- Artifacts are decorative and aria-hidden. They cannot carry required instructions or state.

- Use deterministic seeded positions per invite so refresh does not make the world feel randomly regenerated.

### 5.5 Buttons and controls

- Primary action: full or near-full width on mobile, 52-56 px height, 18 px radius, solid accent-strong text contrast verified per theme, a restrained inner top highlight and a custom trailing arrow/route mark.

- Secondary action: transparent glass with hairline border; never low-contrast text-only when it is a necessary escape or cancel path.

- Choice tile: 68 px minimum height; icon well 36-40 px; label 15.5-16.5 px semibold; selected state uses fill, border and check glyph together.

- Focus ring: 3 px outer ring using accent plus 2 px ivory separation. It must be visible on glass and tinted backgrounds.

- Pressed state uses scale 0.985 and brightness shift. Do not use rubbery spring overshoot for every tap.

- Disabled states remain readable and explain why through adjacent copy. Opacity never falls below 0.52 for essential labels.

## 6. Motion and dynamism system

Motion is a language with hierarchy. It should direct attention, preserve continuity and make the site feel alive. It must never compete with emotional text, cause nausea or drain a phone battery while the page is idle.

| **Motion tier**           | **Duration**         | **Easing / spring**                            | **Use**                                          |
|---------------------------|----------------------|------------------------------------------------|--------------------------------------------------|
| Micro response            | 90-180 ms            | ease-out; no overshoot                         | Press, focus, icon response, selection tick      |
| Component state           | 180-320 ms           | cubic-bezier(.22,1,.36,1)                      | Choice selection, note expansion, sheet feedback |
| Scene transition          | 380-560 ms           | cubic-bezier(.22,1,.36,1)                      | Exit/enter between experience stages             |
| Signature/reveal ceremony | 1,200-1,600 ms total | Choreographed keyframes; one controlled spring | Seal and final invitation only                   |
| Ambient drift             | 12-28 s loops        | linear or sine-like; seeded phase              | Background artifacts; paused when page hidden    |

### 6.1 Scene transition contract

1.  Current scene lowers opacity to 0 and moves 6 px upward over 160-200 ms.

2.  The background does not reset. It rebalances colour and artifact alignment across the transition, providing continuity.

3.  Next scene enters from 10 px below over 360-420 ms. Primary heading enters first; supporting elements stagger 45-70 ms.

4.  Focus moves programmatically to the new h1/h2 after the transition, but announcements must not wait longer than 500 ms.

5.  During reduced motion, replace spatial movement and parallax with 120-180 ms opacity changes; colour wash becomes a 160 ms crossfade.

### 6.2 Pointer, touch and ambient behaviour

- Desktop fine pointer: map pointer displacement from viewport centre to MotionValues. Each artifact receives a unique multiplier producing 4-16 px translation and at most 2 degrees rotation. Use spring smoothing; never set React state on pointermove.

- Touch: no continuous finger-following layer. A touch may create one soft radial response at the contact point and nudge the nearest artifact 4-8 px. Ambient drift remains the primary background motion.

- Do not request device-orientation permission. Gyroscope-driven backgrounds are inconsistent, intrusive and unnecessary.

- Pause ambient loops when document.visibilityState is hidden. Lower or pause them when the signing canvas or software keyboard is active.

- Use transform and opacity for continuous motion. Never animate blur radius, box-shadow spread, top/left or large background-position values every frame.

## 7. Mobile-first layout specification

| **Viewport class** | **Content gutter** | **Card width**                         | **Primary behaviour**                                             |
|--------------------|--------------------|----------------------------------------|-------------------------------------------------------------------|
| 320-374 px         | 16 px + safe area  | calc(100% - 32px)                      | Single column, reduced decoration, compact display size           |
| 375-430 px         | 20 px + safe area  | calc(100% - 40px)                      | Primary target; full animation system within budget               |
| 431-767 px         | 24 px + safe area  | max 34rem                              | More breathing room; some two-column choices                      |
| 768 px and above   | 32 px              | max 40rem experience / 48rem agreement | Centred composition; fine-pointer parallax enabled when supported |

- Use min-height:100svh for initial stability and min-height:100dvh where dynamic fitting is necessary. Provide a 100vh fallback before both declarations.

- Apply viewport-fit=cover and padding with env(safe-area-inset-top/right/bottom/left), always added to a base spacing value.

- Bottom actions must remain above iPhone home indicator and Android gesture area. Use sticky action wells only where content scrolls; do not cover agreement text.

- When the software keyboard opens, rely on the visual viewport and normal flow. Do not vertically centre the active form; align it near the top with 16-24 px clearance.

- Landscape phones must remain usable without an orientation lock. Reduce decorative layers and let content scroll.

- Tap targets are at least 48 x 48 px with 8 px separation. Primary actions are 52-56 px tall.

- No hover-only tooltips. Explanations appear on tap/focus and remain dismissible.

## 8. Content and tone governance

- The voice is affectionate, intelligent and cheeky. It may tease behaviour, logistics and the artificial seriousness of paperwork; it must never tease appearance, insecurity, money limitations or consent.

- Do not add language lifted from Isaac’s earlier birthday letter. The approved prologue conveys depth in distinct wording and is the only canonical emotional copy unless Isaac supplies more.

- Do not generate runtime copy with an LLM. All acknowledgements and jokes use a reviewed static copy map.

- Do not add pet names beyond “my love” unless Isaac supplies them.

- No emoji in primary UI copy. Emotion is carried by typography, timing and custom artwork.

- Keep sentence case. Avoid all-caps except tiny labels, seal text and technical status in the host view.

## 9. Failure and edge-state experience

| **Condition**          | **Recipient treatment**                                                                                           | **Never do**                                                   |
|------------------------|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Invalid/expired invite | Quiet neutral card: “This little page is unavailable right now.” Provide a contact-Isaac hint only if configured. | Expose stack errors, destination, names or token status.       |
| Offline before signing | Continue locally; show a small offline indicator only when submission becomes relevant.                           | Block the experience at entry.                                 |
| Offline during signing | Preserve signature and answers; show Retry and “Nothing has been lost.”                                           | Show the reveal before server confirmation.                    |
| Refresh mid-flow       | Restore the exact stage and draft, then show a one-line “I kept your place.”                                      | Restart or replay long intro automatically.                    |
| Already sealed         | Open the final locked invitation using the stored theme and name.                                                 | Return to editable questions.                                  |
| Reduced motion         | Crossfades, immediate state clarity, static artifacts.                                                            | Remove content or make timing-dependent controls inaccessible. |
| Low performance mode   | Reduce blur, artifact count and ambient loops via capability heuristic.                                           | Display a “your phone is slow” message.                        |

**PART II**

# Technical Architecture and UI/UX Platform Requirements

> **ARCHITECTURE DECISION**
>
> Build a single Next.js App Router application in strict TypeScript, deployed to Vercel. Render the outer route and private validation server-side, then hydrate one deliberately bounded client experience shell. Use Motion for React and custom CSS/SVG for movement, Tailwind CSS theme variables for the token system, Radix only as unstyled accessibility infrastructure, and Neon Postgres for one encrypted sealed response. Do not introduce a CMS, 3D renderer or general-purpose design system.

## 10. Approved technology platform

| **Layer**               | **Required choice**                                     | **Implementation rule**                                                                                                              |
|-------------------------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Framework               | Current stable Next.js App Router                       | Install stable next, never canary. Use Server Components by default and Client Components only for the interactive experience.       |
| Language                | TypeScript strict mode                                  | No implicit any; discriminated unions for stages and actions; typed content/config registry.                                         |
| Runtime/package manager | Current Vercel-supported active LTS Node; pnpm          | Pin engines and packageManager; commit pnpm-lock.yaml.                                                                               |
| Styling                 | Tailwind CSS v4 plus authored CSS modules/global tokens | Tailwind handles layout and tokens; visual craft lives in project variables and named component classes, not arbitrary utility soup. |
| Animation               | motion package / Motion for React                       | Use LazyMotion, MotionValues, AnimatePresence/layout and reduced-motion configuration.                                               |
| Accessible primitives   | Radix Dialog, Alert Dialog, Visually Hidden             | Unstyled behaviour only; no imported visual theme.                                                                                   |
| Icons                   | Custom SVG set plus @phosphor-icons/react utilities     | Custom scene icons first; Phosphor only for edit, close, clear and download.                                                         |
| Signature               | signature_pad                                           | Use a dedicated client component, high-DPI canvas and full-screen mobile signing view.                                               |
| Validation              | Zod                                                     | Share schemas between client draft validation and server submission.                                                                 |
| Database                | Neon Postgres through Vercel Marketplace                | Store a minimal encrypted response envelope and timestamps; no analytics profile.                                                    |
| Database access         | Drizzle ORM plus Neon serverless driver                 | Use parameterised queries, migrations and one transaction for sealing.                                                               |
| Generated invitation    | Next.js ImageResponse / @vercel/og capability           | Server-render a deterministic PNG; no DOM screenshot library.                                                                        |
| Testing                 | Vitest, Testing Library, Playwright, axe integration    | Unit logic, component behaviour, mobile browser journeys and accessibility gates.                                                    |
| Deployment              | Vercel Git integration                                  | Preview deployments for QA; production env separated; build validation blocks placeholders.                                          |

### 10.1 Explicitly prohibited dependencies

- Three.js / React Three Fiber: unnecessary GPU, bundle and device variability for an abstract 2D atmosphere.

- Lottie: the motion system must be theme-reactive and state-aware; canned animation files create mismatch.

- Particle/confetti libraries: the final ceremony uses five authored charms, not generic particles.

- GSAP: Motion plus CSS/Web Animations covers the required choreography; a second animation runtime would fragment timing and increase weight.

- Lenis or forced smooth-scroll libraries: preserve native mobile scrolling, browser gestures and accessibility.

- shadcn/ui or visually opinionated UI kits: Radix behaviour may be used directly, but every visual surface is bespoke.

- Client-side screenshot libraries for the invitation: generated server image is sharper and more reliable across iOS/Android.

- Remote analytics, session replay, advertising pixels and remote font/CDN calls.

## 11. Application topology

```text
Browser (private invite URL)
└─> Next.js Server Route validates token hash
    └─> ExperienceShell client island
        └─> local draft persistence (device only)
            └─> POST /api/invite/[token]/seal (Zod + idempotency)
                └─> AES-256-GCM response envelope
                    └─> Neon Postgres transaction
                        └─> GET /api/invite/[token]/card.png (sealed only)

Isaac host route
└─> server-side host authentication
    └─> decrypt sealed payload on server
        └─> read-only responsive summary; never expose encryption key to client
```

### 11.1 Rendering boundary

- Server-render route validation, metadata, unavailable state, sealed-state redirect and non-interactive shell.

- Hydrate a single ExperienceShell client boundary after validation. Keep database, crypto and host access modules server-only using the server-only package marker.

- Dynamically import SignatureSurface and final card preview only when reached. Do not ship signature_pad in the initial bundle.

- The ambient layer remains one client component driven by MotionValues and CSS variables. Individual artifacts must not each own global pointer listeners.

## 12. Repository structure

```text
birthday-experience/
├─ app/
│  ├─ for/[token]/page.tsx                 # validated recipient route
│  ├─ host/page.tsx                        # authenticated read-only host view
│  ├─ api/invite/[token]/seal/route.ts     # idempotent final submission
│  ├─ api/invite/[token]/card/route.tsx    # generated PNG invitation
│  ├─ api/host/session/route.ts            # host login/session
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ manifest.ts
│  ├─ robots.ts
│  └─ not-found.tsx
├─ components/
│  ├─ experience/ExperienceShell.tsx
│  ├─ experience/SceneFrame.tsx
│  ├─ experience/scenes/*.tsx
│  ├─ ambient/AmbientWorld.tsx
│  ├─ ambient/Artifact.tsx
│  ├─ controls/ChoiceCard.tsx
│  ├─ controls/GlassAction.tsx
│  ├─ controls/ThemeSwatch.tsx
│  ├─ agreement/LoverAgreement.tsx
│  ├─ signature/SignatureSurface.tsx
│  └─ invitation/InvitationCard.tsx
├─ content/
│  ├─ experience-copy.ts                   # exact approved wording
│  ├─ agreement-v1.ts                      # immutable agreement version
│  └─ response-copy.ts                     # reviewed joke/acknowledgement map
├─ lib/
│  ├─ experience/reducer.ts
│  ├─ experience/guards.ts
│  ├─ experience/persistence.ts
│  ├─ theme/themes.ts
│  ├─ motion/tokens.ts
│  ├─ server/crypto.ts
│  ├─ server/invites.ts
│  ├─ server/host-auth.ts
│  └─ validation/schemas.ts
├─ db/
│  ├─ schema.ts
│  └─ migrations/
├─ public/artifacts/*.svg
├─ tests/{unit,components,e2e}/
├─ next.config.ts
├─ playwright.config.ts
├─ vitest.config.ts
└─ package.json
```

## 13. State model and navigation logic

Use a typed reducer rather than a general state library. The flow is finite, small and safety-critical around locking; explicit actions and guards are easier to audit than ad hoc component state. The reducer is the only authority allowed to change stage or answers.

```ts
type Stage =
  | "arrival" | "name" | "theme" | "prologue"
  | "wish" | "wishConfirm" | "spoilModes" | "travelPersona"
  | "mustNotMiss" | "review" | "agreement" | "signature"
  | "sealing" | "reveal";

type ExperienceState = {
  schemaVersion: 1;
  inviteId: string;
  stage: Stage;
  preferredName: string;
  themeId: ThemeId | null;
  birthdayWish: "vacation" | null;
  spoilModes: SpoilModeId[];
  travelPersona: TravelPersonaId | null;
  mustNotMiss:
    | { kind: "text"; value: string }
    | { kind: "surprise" }
    | null;
  agreementVersion: "lover-agreement-v1";
  agreementAcknowledgedAt: string | null;
  signature: SignatureDraft | null;
  sealedAt: string | null;
  revisionReturnStage: "review" | null;
};
```

### 13.1 Transition guards

| **Transition**                | **Required guard**                      | **Failure behaviour**                        |
|-------------------------------|-----------------------------------------|----------------------------------------------|
| name -\> theme                | trimmed preferredName length 1-32       | Inline message; retain focus; no shake.      |
| theme -\> prologue            | themeId is known theme enum             | No advance; announce selection requirement.  |
| wishConfirm -\> spoilModes    | affirmative vacation confirmation       | Close returns to wish scene.                 |
| spoilModes -\> travelPersona  | 1-4 stable selection IDs                | Explain at least one is needed.              |
| travelPersona -\> mustNotMiss | one enum value                          | No advance.                                  |
| mustNotMiss -\> review        | valid text 2-280 or surprise flag       | Inline validation; never discard text.       |
| review -\> agreement          | entire state schema passes              | Highlight first invalid row and edit action. |
| signature -\> sealing         | acknowledged, valid signature, unsealed | Explain exact missing requirement.           |
| sealing -\> reveal            | server confirms sealed record           | Retry state; never optimistic reveal.        |

### 13.2 Browser history and persistence

- Push a history entry per stage after arrival. A popstate action moves backward through the reducer only while unsealed.

- When sealed, replace current history state with reveal and reject edit-stage restoration from stale history entries.

- Persist the unsealed draft under birthday:v1:\[inviteId\]. Never use a global key that could mix invites.

- Persist after meaningful reducer changes with a 150 ms debounce. Flush synchronously on visibilitychange/pagehide when possible.

- Do not store invite tokens inside the draft payload. The route already contains the token; use inviteId as the storage key.

- After confirmed sealing, erase signature draft and free-text local draft, retaining only themeId, preferredName, sealedAt and final invitation cache metadata.

## 14. Content registry

All approved copy lives outside components in a typed registry. Components receive content values; they do not contain strings. The agreement is immutable versioned content because the stored acceptance references a version.

```ts
export const experienceCopy = {
  arrival: {
    title: "Welcome to the side of the internet that's dedicated to you.",
    body: "Before this little place becomes yours, let it meet you properly.",
  },
  // ...all approved scene strings...
} as const;

export const loverAgreementV1 = {
  id: "lover-agreement-v1",
  effectiveDate: "2026-08-25",
  markdown: `...exact approved agreement...`,
} as const;
```

- Render approved controlled Markdown using a restricted parser or structured blocks. Disable raw HTML entirely.

- Interpolate only allowlisted tokens such as preferredName, destination and dates. Escape output by default.

- Add snapshot tests for the opening, prologue, questions, agreement final sentence and reveal copy so refactors cannot silently alter wording.

## 15. Theme engine implementation

1.  Define every selectable theme as a typed record with ID, display name, accent, precomputed fallback tokens and contrast-safe action foreground.

2.  Write selected tokens to document.documentElement before scene rendering. Persist themeId immediately.

3.  For the radial wash, capture pointer/touch coordinates relative to viewport. Render a fixed circular overlay using accent-soft and animate scale from 0 to enough to cover the farthest viewport corner.

4.  Switch the root tokens at overlay start, then fade the overlay after coverage. This prevents the old theme from flashing through.

5.  Update meta theme-color to a quiet mixed canvas colour for Android browser chrome. Treat iOS browser chrome colouring as a progressive enhancement.

6.  Re-run automated contrast tests for every theme record. Do not assume derived colour-mix outputs remain readable.

## 16. Motion implementation architecture

```tsx
<MotionConfig reducedMotion="user" transition={motionTokens.component}>
  <PointerMotionProvider>
    <AmbientWorld stage={state.stage} theme={state.themeId} />
    <AnimatePresence mode="wait" initial={false}>
      <SceneFrame key={state.stage} stage={state.stage}>
        {activeScene}
      </SceneFrame>
    </AnimatePresence>
  </PointerMotionProvider>
</MotionConfig>
```

- Use LazyMotion with domAnimation features initially. Load domMax only if a proven required gesture cannot be expressed otherwise.

- PointerMotionProvider owns x/y MotionValues and one pointermove listener gated by (hover:hover) and (pointer:fine). Children derive transforms through useTransform/useSpring.

- AmbientWorld receives a stage intensity map: prologue 0.6, playful questions 1.0, sincere note 0.25, agreement 0.15, reveal 0.8.

- Use usePageInView or visibilitychange to pause animation work while backgrounded.

- Do not place layout-animated elements inside independently scaled ancestors; it causes incorrect geometry measurements.

- All animation constants live in lib/motion/tokens.ts. Hard-coded one-off durations inside scene components are prohibited.

## 17. Component contracts

| **Component**    | **Responsibilities**                                                              | **Must not do**                                                     |
|------------------|-----------------------------------------------------------------------------------|---------------------------------------------------------------------|
| ExperienceShell  | Reducer, persistence, stage routing, server sealing status, focus handoff.        | Contain scene-specific visual markup or approved copy.              |
| SceneFrame       | Consistent viewport geometry, enter/exit motion, safe-area padding, focus target. | Know answers or business rules.                                     |
| AmbientWorld     | Artifacts, pointer/touch response, stage intensity, pause logic.                  | Render interactive controls or capture pointer events over content. |
| ChoiceCard       | Radio/checkbox/button semantics, selected visual, focus and press feedback.       | Infer question type from label text.                                |
| ThemeSwatch      | Radio semantics, material preview, wash-origin coordinate.                        | Apply root theme by itself.                                         |
| LoverAgreement   | Canonical structured rendering, acknowledgement, legal joke response.             | Own signature data or submission.                                   |
| SignatureSurface | High-DPI canvas, clear/typed fallback, local signature validation.                | Call database directly or mark state sealed.                        |
| InvitationCard   | Display final immutable invitation and download action.                           | Reintroduce editing or show unconfirmed data.                       |

## 18. Signature implementation

1.  Dynamically import signature_pad when the signing scene opens.

2.  Create the canvas at CSS size, then set physical width and height to CSS dimensions multiplied by devicePixelRatio, capped at 3 to control memory. Scale the 2D context accordingly.

3.  Set touch-action:none on the canvas only. Lock background scroll while the full-screen signing surface is open and restore it on close.

4.  Store point groups from signaturePad.toData(), not a base64 PNG. Validate that all values are finite numbers, cap point count and payload bytes, and reconstruct in host view.

5.  On resize/orientation change, cache point data, resize the canvas, then redraw scaled points. Test this explicitly on iPhone Safari and Android Chrome.

6.  Typed fallback stores Unicode-normalised text and renders it in Fraunces Italic. It is labelled as a ceremonial acknowledgement, not a legal e-signature.

7.  The final submission payload must not include raw SVG or arbitrary HTML.

## 19. Data architecture and database

The experience is a single-recipient private application. The database should therefore be minimal. Store token hashes and timestamps in queryable columns, but store personal answers as one authenticated encrypted envelope. This reduces accidental exposure from dashboards, logs and broad queries.

```sql
CREATE TABLE invite_sessions (
  id uuid PRIMARY KEY,
  public_id text UNIQUE NOT NULL,
  invite_token_hash text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('issued', 'opened', 'sealed', 'revoked')),
  agreement_version text NOT NULL DEFAULT 'lover-agreement-v1',
  encrypted_payload text NULL, -- base64 AES-GCM envelope
  payload_schema_version integer NULL,
  opened_at timestamptz NULL,
  sealed_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  idempotency_key_hash text UNIQUE NULL
);
```

### 19.1 Encrypted payload

```ts
type SealedPayloadV1 = {
  preferredName: string;
  themeId: ThemeId;
  birthdayWish: "vacation";
  spoilModes: SpoilModeId[];
  travelPersona: TravelPersonaId;
  mustNotMiss: { kind: "text"; value: string } | { kind: "surprise" };
  agreementVersion: "lover-agreement-v1";
  agreementAcknowledgedAt: string;
  signature:
    | { kind: "drawn"; points: PointGroup[] }
    | { kind: "typed"; value: string };
};
```

- Encrypt with AES-256-GCM in the Node runtime using a 32-byte RESPONSE_ENCRYPTION_KEY stored only in Vercel production environment variables.

- Generate a new 96-bit IV per envelope and bind invite public_id plus schema version as additional authenticated data.

- Store version, IV, authentication tag and ciphertext in a compact JSON/base64 envelope. Never reuse an IV with the same key.

- Decrypt only in the server-rendered authenticated host route and generated card route where necessary. Never send the key or full decrypted payload to generic client telemetry.

- Back up the encryption key outside the repository. Losing it makes sealed answers unrecoverable; rotating it requires a versioned key strategy.

## 20. API contracts

| **Endpoint**                      | **Request**                                     | **Response / rules**                                                                                                               |
|-----------------------------------|-------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| GET /for/\[token\]                | Path token; no query PII                        | Server hashes token, loads invite status, returns experience shell or locked reveal. Cache: private, no-store.                     |
| POST /api/invite/\[token\]/opened | Optional public_id + timestamp                  | Idempotently sets opened_at; does not store IP/user-agent. Failure never blocks experience.                                        |
| POST /api/invite/\[token\]/seal   | Zod-validated SealedPayloadV1 + idempotency key | Validates token/status, encrypts, writes one transaction, returns sealedAt and reveal capability. Rejects conflicting second seal. |
| GET /api/invite/\[token\]/card    | Valid sealed token                              | Returns image/png with Content-Disposition attachment where supported; contains only final invite details.                         |
| POST /api/host/session            | Host password over TLS                          | Constant-time verification; sets Secure HttpOnly SameSite=Strict session cookie.                                                   |
| GET /host                         | Valid host session cookie                       | Server-rendered decrypted read-only summary; no client caching.                                                                    |

### 20.1 Submission semantics

- Generate the idempotency key client-side when the signature becomes valid; preserve it through retries.

- Within one database transaction: lock invite row, reject revoked/invalid status, return existing success for the same idempotency hash, reject a different second submission, encrypt payload, update sealed state and commit.

- Return generic error messages to the recipient. Log server error codes without personal answer payloads.

- Cap request body size at 300 KB and signature point count at a documented safe limit such as 12,000 points after simplification.

- Use origin and content-type checks for POST routes. SameSite cookies protect host actions; recipient token routes do not rely on cookies.

## 21. Private access, privacy and security

- Generate invite tokens from at least 128 bits of cryptographic randomness. Store only SHA-256 token hashes in the database. Never use names or birthdays as URL secrets.

- Set robots metadata to noindex, nofollow, noarchive and emit X-Robots-Tag with the same policy. robots.txt should disallow all routes, but token secrecy remains the actual access control.

- Set Referrer-Policy:no-referrer. The production experience must have no third-party subresources, so the private token cannot leak through referrers.

- Set a restrictive Content-Security-Policy: default-src self; script-src self with framework-required nonce/hash strategy; style-src self plus required inline token strategy; img-src self data blob; connect-src self plus the server’s Neon access only server-side; object-src none; base-uri none; frame-ancestors none; form-action self.

- Set X-Content-Type-Options:nosniff, Permissions-Policy disabling camera, microphone, geolocation and unnecessary sensors, and Strict-Transport-Security through Vercel production.

- Do not include destination, dates, names or romantic copy in Open Graph metadata, deployment titles, error monitoring breadcrumbs or analytics.

- Host access uses a password-derived server secret and short secure session. The host page must not be protected only by an obscure URL.

- Do not persist raw IP addresses, complete user agents, canvas fingerprints or interaction recordings.

- Signature wording is ceremonial; do not represent it as legally binding.

## 22. Host view for Isaac

The host view is a quiet operational companion, not a second decorative experience. It must work on iPhone Safari and show whether the invite was opened or sealed, the chosen theme, answers, signed agreement version and the final invitation preview. It is read-only in the first release.

- Use the same fonts and colour tokens but reduce animation to a single entrance and status pulse.

- Render decrypted answers server-side. Do not ship the encryption key or encrypted envelope to the browser.

- Provide “View invitation image” and “Copy practical preferences” actions. Do not expose the raw token or signature point JSON.

- Signature preview may be reconstructed into an SVG/canvas server-side or within a tightly scoped client component receiving only validated points.

- No edit or reset action in V1. Resetting a sealed invitation is a deliberate database administration operation outside the UI.

## 23. Generated invitation image

- Generate at 1080 x 1350 px for a portrait, phone-friendly keepsake with a 4:5 ratio.

- Embed/subset the same Fraunces and Manrope font assets. Do not fetch remote fonts at image-generation time.

- Use the selected theme accent, ivory canvas, preferred name, destination, dates and final note. Include no private questionnaire answers.

- Use deterministic layout and server-side rendering so Android and iOS receive identical pixels.

- Filename format: birthday-invitation-\[sanitised-preferred-name\].png. Strip unsafe filename characters.

- If destination is configured as a surprise, the image must say “Destination: sealed for now” or the exact configured phrase; never infer a place.

## 24. Accessibility specification

| **Area**      | **Release requirement**                                                                                                        |
|---------------|--------------------------------------------------------------------------------------------------------------------------------|
| Semantics     | One page h1; logical h2 scenes where rendered; fieldset/legend for questions; native input semantics beneath custom visuals.   |
| Keyboard      | Every path completable without a pointer. Focus never follows moving decoration. Money joke does not move during keyboard use. |
| Focus         | Visible custom ring, logical order, focus trapped in dialogs/signing sheet and returned to trigger on close.                   |
| Announcements | Polite live region for jokes, validation and sealing status; avoid announcing decorative transitions.                          |
| Contrast      | WCAG AA: 4.5:1 normal text, 3:1 large text and control boundaries where required; test every theme.                            |
| Motion        | Respect prefers-reduced-motion through MotionConfig and CSS. No critical information depends on animation completion.          |
| Zoom/text     | Usable at 200 percent zoom and browser text enlargement; no clipped agreement or fixed-height text cards.                      |
| Touch         | 48 px targets, adequate spacing, no hover dependency, full-screen non-scrollable signature canvas area.                        |
| Errors        | Specific text tied with aria-describedby; no colour-only or shake-only errors.                                                 |
| Images/icons  | Decorative artifacts aria-hidden; functional icons have labels; generated invitation has an equivalent textual view.           |

## 25. Mobile performance and quality budgets

| **Metric / resource**     | **Target**                                     | **Hard ceiling / action**                                                   |
|---------------------------|------------------------------------------------|-----------------------------------------------------------------------------|
| Largest Contentful Paint  | \< 2.0 s on representative 4G mid-tier Android | Release block above 2.5 s in production-like test.                          |
| Interaction to Next Paint | \< 150 ms                                      | Release block above 200 ms for primary interactions.                        |
| Cumulative Layout Shift   | \< 0.05                                        | Hard ceiling 0.10. Font and dynamic card geometry must be reserved.         |
| Initial route JS          | \< 170 KB gzip application JS                  | Investigate above 200 KB; signature/reveal chunks excluded until requested. |
| Initial fonts             | \< 110 KB total WOFF2 subsets                  | Use only required weights/axes; no full font families.                      |
| Ambient nodes             | \<= 8 mobile, \<= 12 desktop                   | Reduce to 4 on low-performance mode.                                        |
| Backdrop blur layers      | \<= 3 simultaneously                           | Fallback to translucent solid surface if frame rate degrades.               |
| Animation frame rate      | Near 60 fps during interaction                 | No sustained main-thread task \> 50 ms during scene transitions.            |
| Database/API              | Seal p95 \< 1.2 s in target region             | Keep safe retry UI visible; never reveal optimistically.                    |

### 25.1 Low-performance adaptation

- Do not rely on navigator.deviceMemory alone. Use a conservative compound heuristic: small memory/concurrency hints when available, reduced motion preference, initial long-task observation and measured animation frame stability.

- Adapt only visual cost: disable grain animation, reduce artifacts, replace backdrop blur with a solid translucent surface and lower pointer response frequency.

- Never remove copy, choices, signing fallback or final practical information.

## 26. Device-specific requirements

| **Platform**            | **Known risk**                                                                     | **Required handling**                                                                              |
|-------------------------|------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Android Chrome          | Wide device performance range; keyboard resizing; download behaviour               | Test mid-tier hardware, visual viewport, low-performance mode and direct PNG download.             |
| Samsung Internet        | Rendering differences in blur and viewport chrome                                  | Smoke-test current Samsung Internet; glass fallback must remain attractive.                        |
| iPhone Safari           | Dynamic toolbars, safe areas, input zoom, canvas scaling and download restrictions | Use dvh/svh, 16 px inputs, safe-area padding, DPR-aware signature, image-open fallback.            |
| iPhone private browsing | Storage lifecycle can be shorter                                                   | Draft persistence helps but cannot be guaranteed; never claim permanent saving before server seal. |
| Desktop fine pointer    | Hover/cursor enhancements can overshadow content                                   | Enable restrained parallax only under hover:hover and pointer:fine.                                |

## 27. Testing strategy

### 27.1 Unit tests

- Reducer accepts only legal stage transitions and rejects edits after sealedAt.

- Zod schemas enforce all lengths, enums, mutually exclusive note/surprise values and signature payload limits.

- Theme registry has unique IDs, required fallbacks and contrast pass results.

- Encryption round-trip, wrong-key failure, altered authentication tag failure and AAD mismatch.

- Date formatting and countdown across timezone boundaries and daylight changes.

- Content snapshots for all approved copy, especially the edited opening and final agreement sentence.

### 27.2 Component tests

- Colour swatches expose radio semantics and apply the correct theme.

- Money option resolves after maximum three attempts; keyboard path never moves focus.

- Vacation dialog traps and returns focus correctly.

- Multi-select and radio cards announce state and enforce guards.

- Free-text/surprise exclusivity preserves or confirms clearing entered text.

- Agreement acknowledgement and legal-representation response.

- Signature typed fallback, empty path rejection and Retry persistence.

### 27.3 End-to-end Playwright projects

| **Project**                           | **Purpose**               | **Required journey**                                                                                         |
|---------------------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Pixel-class Chromium, 390 x 844 touch | Primary Android flow      | Complete all stages, choose theme, exercise money joke, draw signature, retry simulated network, save image. |
| iPhone 13-class WebKit                | Primary iOS behaviour     | Keyboard, safe areas, dialog focus, signature resize, locked revisit and image fallback.                     |
| iPhone SE-class WebKit                | Small-screen stress       | Agreement scroll, choice wrapping, no clipped actions, typed signature.                                      |
| Desktop Chromium                      | Fine-pointer enhancements | Pointer parallax, money evasion bounds, keyboard-only complete flow.                                         |
| Reduced-motion Chromium/WebKit        | Accessible motion path    | No large transforms/parallax; all timing and controls remain functional.                                     |

Emulation is necessary but not sufficient. Before production, manually test on at least one physical Android phone in Chrome and Isaac’s physical iPhone in Safari. Record device model, OS/browser version, observed frame stability, keyboard behaviour, signing accuracy and invitation saving result.

## 28. Visual QA checklist

- No generic nav, stepper, dashboard chrome or visible framework defaults.

- Selected colour is present across surfaces, shadow tint, artifacts and controls without reducing text contrast.

- Glass surfaces remain readable over every background position and on blur fallback.

- Typography loads without flash-driven layout shift; headings never orphan at the bottom of a screen.

- Artifact motion is visible when looked for, but ignorable while reading.

- No pink hue introduced by burgundy mixing, glow or default focus colours.

- Icons share stroke width, corner treatment and optical size.

- Primary actions do not look like generic Tailwind/shadcn buttons.

- Every scene has one obvious next action and one clear reading focus.

- The sincere question is calmer than surrounding playful questions.

- Agreement reads naturally and the final edited sentence is exact: “Please sign only if you are prepared to be loved, celebrated and ready to make bad decisions.”

- Final reveal uses the recipient’s answers as subtle visual evidence, not a cluttered summary.

## 29. Vercel deployment specification

1.  Create separate Preview and Production environments. Preview uses a separate Neon branch/database and non-production invite tokens.

2.  Set Node/package manager versions in package.json and Vercel project settings. Commit the lockfile.

3.  Provision Neon through the current Vercel Marketplace integration. Do not attempt to provision legacy Vercel Postgres, which is no longer available.

4.  Configure DATABASE_URL, RESPONSE_ENCRYPTION_KEY, HOST_PASSWORD_HASH, HOST_SESSION_SECRET, VACATION_DESTINATION, VACATION_START, VACATION_END, FINAL_PRIVATE_NOTE and PUBLIC_SITE_ORIGIN as scoped environment variables.

5.  Run migrations in a controlled deployment step. Preview migrations target preview storage only.

6.  Build-time config validation must fail production if dates, destination mode, final note, encryption key or host secret are missing.

7.  Enable a custom domain and HTTPS. Ensure no Vercel preview URL is shared as the final invitation.

8.  Disable public source maps in production unless an error service is deliberately configured without personal payload capture.

9.  Set response headers, CSP, noindex policies and no-store caching for private routes. Verify with automated tests against the deployed URL.

10. Issue one invite row and generate the recipient URL using a local/admin provisioning script. Send the URL privately; never place it in a public repository or social preview.

### 29.1 Environment variable contract

| **Variable**            | **Scope**                           | **Validation / handling**                                                   |
|-------------------------|-------------------------------------|-----------------------------------------------------------------------------|
| DATABASE_URL            | Preview + Production distinct       | Server only; supplied by Neon integration.                                  |
| RESPONSE_ENCRYPTION_KEY | Production secret; preview separate | Base64 32 bytes; fail closed if invalid. Back up securely.                  |
| HOST_PASSWORD_HASH      | Production secret                   | Argon2id/scrypt-compatible stored hash; never plaintext password in source. |
| HOST_SESSION_SECRET     | Production secret                   | At least 32 random bytes; rotate invalidates sessions.                      |
| VACATION_DESTINATION    | Public server config after reveal   | Exact supplied value or configured surprise phrase.                         |
| VACATION_START / END    | Public server config after reveal   | ISO dates with explicit timezone; end after start.                          |
| FINAL_PRIVATE_NOTE      | Public only after valid reveal      | 1-180 chars; exact Isaac-approved sentence.                                 |
| PUBLIC_SITE_ORIGIN      | All environments                    | HTTPS production origin; used for absolute URLs and security checks.        |

## 30. CI quality gates

- pnpm install --frozen-lockfile

- TypeScript typecheck and ESLint with no warnings budget for new code.

- Unit and component tests with deterministic animation mocking.

- Database schema/migration validation against preview database.

- Production build and bundle-size budget check.

- Playwright critical journey on Chromium and WebKit at minimum for each pull request; full device matrix before release.

- axe accessibility scan plus manual keyboard test checklist.

- Copy snapshot test and production config placeholder scan.

- Security header and robots/noindex checks against Vercel preview.

## 31. Implementation sequence

| **Milestone**               | **Deliverable**                                                             | **Exit criteria**                                                             |
|-----------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| DEV-01 Foundation           | Next.js project, fonts, tokens, route validation, content registry, tests   | Mobile shell loads fast; private invalid state works; no placeholder leakage. |
| DEV-02 Visual world         | Ambient artifacts, theme engine, colour wash, SceneFrame and controls       | All 14 themes coherent; 60 fps target; reduced motion passes.                 |
| DEV-03 Narrative flow       | Arrival, Set the Mood, prologue and birthday trap                           | Exact copy; Back/persistence; accessible joke and dialog.                     |
| DEV-04 Preference capture   | Spoil modes, travel persona, sincere note and review                        | Validation, edit-return paths and mobile keyboard stable.                     |
| DEV-05 Agreement/signature  | Canonical agreement, acknowledgement, signing surface                       | Physical Android/iPhone signing accurate; typed fallback works.               |
| DEV-06 Secure sealing       | Neon schema, encryption, token validation, idempotent submission, host auth | No plaintext answer storage/logging; retry and conflict paths tested.         |
| DEV-07 Reveal               | Sealing ceremony, locked invitation, countdown and generated PNG            | No optimistic reveal; image saves on Android and has iOS fallback.            |
| DEV-08 Production hardening | Headers, performance, accessibility, real-device QA, deployment             | All Definition of Done gates pass on production domain.                       |

## 32. Definition of Done

The website is complete only when every item below is true. Visual similarity without functional, accessibility, privacy and mobile completeness is not acceptance.

- The approved opening, prologue, questions and edited Lover Agreement are rendered exactly from the content registry.

- The full experience works from arrival through locked reveal on physical Android Chrome and physical iPhone Safari.

- All 14 themes remain subtle, coherent and contrast-safe; no pink theme or accidental pink wash exists.

- Ambient motion, cursor/touch reactions and scene transitions feel continuous but do not obscure reading or controls.

- Reduced-motion users receive the complete experience without parallax, runaway movement or long ceremonies.

- Browser Back and refresh restore unsealed progress; sealing permanently locks editing for that invite.

- Network failure during sealing loses nothing and never displays a false success.

- Sealed answers are encrypted at the application layer, and no personal payload appears in logs or analytics.

- Isaac can securely open the host view on iPhone and read the sealed responses.

- The final invitation image saves correctly or opens with platform-appropriate save guidance.

- Performance budgets, accessibility checks, WebKit/Chromium E2E tests, headers and noindex checks pass.

- Production configuration contains exact destination/dates/private note and no unresolved placeholders.

## 33. Current official references

These references were validated on 25 August 2026. Developers must use current stable releases and re-check breaking-change notes at implementation time; the committed lockfile is the build authority.

**Next.js documentation / App Router:** https://nextjs.org/docs/app

**Next.js TypeScript:** https://nextjs.org/docs/app/api-reference/config/typescript

**Next.js font optimisation:** https://nextjs.org/docs/app/getting-started/fonts

**Motion for React:** https://motion.dev/docs/react

**Motion accessibility / reduced motion:** https://motion.dev/docs/react-accessibility

**Motion layout animation:** https://motion.dev/docs/react-layout-animations

**Tailwind CSS theme variables:** https://tailwindcss.com/docs/theme

**Tailwind responsive design:** https://tailwindcss.com/docs/responsive-design

**Radix accessibility:** https://www.radix-ui.com/primitives/docs/overview/accessibility

**Radix Dialog:** https://www.radix-ui.com/primitives/docs/components/dialog

**Vercel storage marketplace:** https://vercel.com/docs/marketplace-storage

**Neon and Vercel overview:** https://neon.com/docs/guides/vercel-overview

**Neon serverless driver:** https://neon.com/docs/serverless/serverless-driver

**Signature Pad:** https://github.com/szimek/signature_pad

**MDN safe-area environment variables:** https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env

**MDN prefers-reduced-motion:** https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion

**Playwright device emulation:** https://playwright.dev/docs/emulation

# Final implementation instruction

> **PRESERVE THE WORLD**
>
> When uncertain, choose the quieter, more intentional implementation. Remove an effect before adding another one. Keep the recipient’s attention on the words, choices and final invitation. The technology is successful when it disappears into the feeling of the experience.
