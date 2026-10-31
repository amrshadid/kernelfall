import type { TourStop } from '@features/tour/types'
import type { TourScreen } from '@shared/types'
import { RUN_BINDING, shortcutLabel } from '@shared/utils/keyboard'

/** The longest a stop's text may be: one short sentence or two, read in a glance. */
export const MAX_STOP_TEXT_LENGTH = 140

/**
 * The guided tours, one short sentence per stop. A stop whose panel the story
 * hasn't opened yet is skipped, and it plays the first time that panel appears.
 */
export const TOUR_STOPS: Readonly<Record<TourScreen, readonly TourStop[]>> = {
  title: [
    {
      id: 'title:wordmark',
      selector: '.title__wordmark',
      title: 'The Syscall Gate',
      text: 'The red line is the Syscall Gate: Userland above, the Kernel below. You start up top and work your way down.',
      side: 'bottom',
    },
    {
      id: 'title:start',
      // The button itself, not its wrapper with the "where you are" lines under it.
      selector: '.title__continue [data-primary]',
      title: 'Start here',
      text: 'This button always takes you to the next thing to do, and the game saves itself after every step.',
      side: 'right',
    },
    {
      id: 'title:contents',
      selector: '.title__menu',
      title: 'Table of contents',
      text: 'The Kernel Map picks levels, the Codex keeps the man pages you collect, and Settings holds the theme and your saves.',
      side: 'right',
    },
    {
      id: 'title:drawing',
      selector: '.title__drawing',
      title: 'Fig. 1, the Kernel Map around you',
      text: "The red flag is where you stand; the road below is what's next. Select it to open the whole map.",
      side: 'left',
    },
  ],
  map: [
    {
      id: 'map:drawing',
      selector: '.map-board__drawing',
      title: 'The Kernel Map',
      text: 'The Machine in section, surface to hardware. Arrow keys walk the road, Page Up and Page Down change layer, Enter plays.',
      side: 'right',
    },
    {
      id: 'map:gauge',
      // The gauge itself; an empty `div.map-gauge` holds its place while the map loads.
      selector: 'nav.map-gauge',
      title: 'The depth gauge',
      text: 'Every layer at its share of the depth, with the levels you rebuilt. Pick one to go there; Find me brings you back.',
      side: 'right',
    },
    {
      id: 'map:detail',
      selector: '.map-detail',
      title: 'What a level teaches',
      text: 'The skills it gives, what it needs first, your best Taint and the Codex cards it files.',
      side: 'left',
    },
    {
      id: 'map:legend',
      selector: '.map-detail__legend',
      title: 'Read the shapes',
      text: 'Status is drawn as a shape, not just a colour: locked, available, in progress, done.',
      side: 'left',
    },
  ],
  level: [
    {
      id: 'level:guide',
      selector: '#level-guide',
      title: 'The Guide',
      text: 'init (PID 1, the first userspace process) talks you through the level here, with the objectives to meet.',
      side: 'right',
    },
    {
      id: 'level:steps',
      selector: '.kf-rail',
      title: 'Five steps',
      text: 'Scene, See it, Build it, Watch it, Card. Finished steps stay clickable so you can look again.',
      side: 'bottom',
    },
    {
      id: 'level:editor',
      selector: '#level-editor',
      title: 'Your code',
      text: `Write C here. Run (${shortcutLabel(RUN_BINDING)}) builds it with gcc inside the Machine's Linux and runs it.`,
      // Over the terminal's right side, clear of its prompt and greeting.
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'level:terminal',
      selector: '#level-terminal',
      title: 'The terminal',
      text: "A shell on the Machine's real Linux: type commands, run your program, read what the kernel says back.",
      // Over the editor's right side; code lines start at the left.
      side: 'top',
      align: 'end',
    },
    {
      id: 'level:xray',
      selector: '#level-xray',
      title: 'X-ray',
      text: 'Every syscall your command makes crosses the Gate here, logged the way strace prints it.',
      side: 'left',
    },
    {
      id: 'level:hint',
      selector: '.kf-hint',
      title: 'Hints',
      text: 'Three per level: a nudge, the concept, then the spot. They never add Taint.',
      side: 'bottom',
    },
    {
      id: 'level:taint',
      selector: '.kf-taint',
      title: 'Taint',
      text: 'Hacks that pass anyway (leaks, ignored errors, warnings) add Taint, like a tainted kernel. Clean code keeps it at 0.',
      side: 'bottom',
    },
    {
      id: 'level:status',
      selector: '.kf-status-bar',
      title: 'Status bar',
      text: 'Save state and whether Linux is running. Press ? any time for every shortcut.',
      // Mid-screen, clear of the Guide's way-on button in the lower left.
      side: 'top',
      align: 'center',
    },
  ],
}
