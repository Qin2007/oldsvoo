// Learn more at developers.reddit.com/docs
import { Devvit, useState, useAsync, useForm } from '@devvit/public-api';
import { svgBuilder } from './assets-function.ts';

Devvit.configure({ redditAPI: true, redis: true });

Devvit.addSettings([
  {
    type: 'boolean', name: 'sticky',
    label: 'add a stickied comment with an explanation of snoovatarcreator?',
    defaultValue: true,
  },
  {
    type: 'boolean', name: 'basicWhite',
    label: 'allow the upload of the basic white snoo?',
    defaultValue: true,
  },
]);

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'create snoopost',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast("Submitting your post - upon completion you'll navigate there.");

    const subredditName = await reddit.getCurrentSubredditName();
    const post = await reddit.submitPost({
      title: `Snoovatar creator (${context.appVersion})`,
      subredditName, preview: create_preview(context.appVersion),
    });
    ui.navigateTo(post);
  },
});

function create_preview(appVersion: string) {
  const bottoms_iterator = 0, glasses_iterator = 0, grippables_iterator = 0, hats_iterator = 0, tops_iterator = 0,
    svgElement = svgBuilder(bottoms_iterator, glasses_iterator, grippables_iterator, hats_iterator, tops_iterator, "#ffffff");
  return (
    <vstack height="100%" width="100%" gap="medium" alignment="center middle">
      <image imageWidth={400} imageHeight={400} width="200px" height="200px" url={svgElement.output} />
      <hstack gap="medium">
        <button appearance="primary" disabled={true}>
          &lt;
        </button>
        <text>loading ({appVersion})</text>
        <button appearance="primary" disabled={true}>
          &gt;
        </button>
      </hstack>
    </vstack>
  );
}

Devvit.addTrigger({
  event: 'PostDelete',
  onEvent: async function (event, context) {
    const postId = event.postId;
    await context.redis.del(`user-iterator-${postId}`);
  },
});

type saveData = {
  bottoms_iterator: number, glasses_iterator: number, grippables_iterator: number,
  hats_iterator: number, tops_iterator: number, color: string, allowRatings?: boolean,
};

//function returnSelf<M>(self:M):M{return self}

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render(context) {
    const [iterator_, setIterator_] = useState(0);
    const [color, set_color] = useState('#ffffff');
    const [category, setcategory] = useState('grippables');
    const [bottoms_iterator, set_bottoms_iterator] = useState(0);
    const [glasses_iterator, set_glasses_iterator] = useState(0);
    const [grippables_iterator, set_grippables_iterator] = useState(0);
    const [hats_iterator, set_hats_iterator] = useState(0);
    const [tops_iterator, set_tops_iterator] = useState(0);
    const [postType, set_postType] = useState('editor');
    const [allowRatings, set_allowRatings] = useState(false);
    const [error_message, set_error_message] = useState('error_message');
    const iterators: any = {
      bottoms_iterator, set_bottoms_iterator,
      glasses_iterator, set_glasses_iterator,
      grippables_iterator, set_grippables_iterator,
      hats_iterator, set_hats_iterator,
      tops_iterator, set_tops_iterator,
    };
    const form: any = useForm({
      title: 'Change Snoo Color', description: 'Change the snoo\'s color',
      fields: [{
        type: "string",
        name: `color`,
        label: `Snoo Color`,
        helpText: "hex 6 part only",
        placeholder: `${color}`, required: true,
      }], acceptLabel: 'paint!', cancelLabel: 'Cancel',
    }, async function (values) {
      const newColor = String(values.color).match(/^#?([a-f0-9]{6})$/i);
      if (newColor) {
        context.ui.showToast("color updated!");
        set_color(`#${newColor[1]}`);
      } else {
        context.ui.showToast("invalid color");
      }
    });
    const titleForm = useForm({
      title: 'Configuate Post', description: 'something to add to your post',
      fields: [
        {
          type: "string",
          name: `title`,
          label: `what to title your post?`,
          defaultValue: `My New Soo`,
          required: true,
        },
        /*{type: "boolean",name: `allowRatings`,label: `allow Ratings?`,
          //helpText: "if true then users can leave ratings on your post, if false then the cant. this WILL NOT disable reddit\'s own voting",
          helpText: 'currently ratings are disabled'
        }*/
      ], acceptLabel: 'CREATE post', cancelLabel: 'cancel',
    }, async function (values) {
      const currentUser = await context.reddit.getCurrentUsername(),
        subredditName = await context.reddit.getCurrentSubredditName();
      if (currentUser && subredditName) {
        const title = `(u/${currentUser}): ` + values.title;
        context.ui.showToast(`Submitting! ${title}`);
        const post = await context.reddit.submitPost({
          title, subredditName, preview: create_preview(context.appVersion),
        }), allowRatings = false;//values.allowRatings;
        context.redis.set(`user-iterator-${post.id}`, JSON.stringify({
          bottoms_iterator, glasses_iterator, grippables_iterator,
          hats_iterator, tops_iterator, color, allowRatings,
        }));
        context.ui.navigateTo(post);
        if (await context.settings.get('sticky')) {
          let text = `Hello, u/${currentUser}.\n\nThanks for using [snoovatar creator](https://developers.reddit.com/apps/snoovatarcreator)`;
          text += ` (A devvit app created by antboiy).\n\nDevvit app posts are marked by the green APP Symbol and interactable\n\n\`${Date()}\``;
          await (await post.addComment({ text })).distinguish(true);
        }
      } else context.ui.showToast("Sorry. only accounts with username can post");
    });

    // @ts-ignore
    useAsync(async function () {
      return await context.redis.get(`user-iterator-${context.postId}`);
    }, {
      finally: function (data, error) {
        if (!error) {
          if (data) {
            const redisData: saveData = JSON.parse(String(data));
            if (redisData) {
              //set_username(redisData.username ?? null);
              set_bottoms_iterator(redisData['bottoms_iterator']);
              set_glasses_iterator(redisData['glasses_iterator']);
              set_grippables_iterator(redisData['grippables_iterator']);
              set_hats_iterator(redisData['hats_iterator']);
              set_tops_iterator(redisData['tops_iterator']);
              set_color(redisData['color'] ?? '#ffffff');
              set_allowRatings(Boolean(redisData['allowRatings']));
              set_postType('Rating');
            } else {
              set_error_message(`JSON-error: ${data} ${error}`);
              set_postType('Errored');
            }
          }
        } else {
          set_postType('Errored');
          set_error_message(`Redis-error: ${error}`);
        }
      },
    });
    const svgElement = svgBuilder(bottoms_iterator, glasses_iterator, grippables_iterator, hats_iterator, tops_iterator, color);
    function setNewCategory(newCat: string): any {
      return function () {
        if (iterators[`set_${category}_iterator`] !== undefined) {
          iterators[`set_${category}_iterator`](iterators[`${category}_iterator`]);
          setIterator_(iterators[`${category}_iterator`]);
        } else setIterator_(0); setcategory(newCat);
        setIterator_(iterators[`${newCat}_iterator`]);
      };
    };
    function set_iterator(sign: "+" | "-"): any {
      return function (): void {
        const newItem = iterator_ + Number(`${sign}1`);
        setIterator_(newItem !== newItem ? 0 : newItem);
        if (iterators[`set_${category}_iterator`] !== undefined) {
          iterators[`set_${category}_iterator`](newItem);
        }
      }
    }
    let insertion = <></>;
    switch (postType) {
      case 'Errored':
        insertion = <>
          <hstack gap="medium">
            <button appearance="primary" disabled={true}>
              &lt;
            </button>
            <text>Errored ({error_message})</text>
            <button appearance="primary" disabled={true}>
              &gt;
            </button>
          </hstack>
        </>;
        break;
      case 'Rating':
        {
          const appearance_rating = 'bordered', duato = function (_: number) {
            context.ui.showToast('well that didnt do anything');
          };
          insertion = <>
            <hstack gap="medium">
              <button appearance="primary" disabled={true}>
                &lt;
              </button>
              <text>their snoo</text>
              <button appearance="primary" disabled={true}>
                &gt;
              </button>
            </hstack>
            <hstack gap="medium">
              <button appearance="caution" onPress={function () {
                set_postType('editor');
              }}>Remix</button>
              {allowRatings ? (<>
                <button appearance={appearance_rating} onPress={function () {
                  duato(1);
                }} icon="star">1</button>
                <button appearance={appearance_rating} onPress={function () {
                  duato(2);
                }} icon="star">2</button>
              </>) : <></>}
            </hstack>
            {allowRatings ? (<>
              <hstack gap="medium">
                <button appearance={appearance_rating} onPress={function () {
                  duato(3);
                }} icon="star">3</button>
                <button appearance={appearance_rating} onPress={function () {
                  duato(4);
                }} icon="star">4</button>
                <button appearance={appearance_rating} onPress={function () {
                  duato(5);
                }} icon="star">5</button>
              </hstack>
            </>) : <></>}
          </>;
        }
        break;
      default:
        insertion = <>
          <hstack gap="medium">
            <button appearance="primary" onPress={set_iterator('-')}>&lt;</button>
            <text>{iterator_} / {String(svgElement[`${category}_bundle_length`] ?? '0')}</text>
            <button appearance="primary" onPress={set_iterator('+')}>&gt;</button>
          </hstack>
          <hstack gap="medium">
            <button appearance={category === 'hats' ? "primary" : "secondary"} onPress={setNewCategory('hats')}>hats ({hats_iterator})</button>
            <button appearance={category === 'glasses' ? "primary" : "secondary"} onPress={setNewCategory('glasses')}>glasses ({glasses_iterator})</button>
            <button appearance={category === 'grippables' ? "primary" : "secondary"} onPress={setNewCategory('grippables')}>grippables ({grippables_iterator})</button>
          </hstack>
          <hstack gap="medium">
            <button appearance={"bordered"} onPress={async function () { context.ui.showForm(form); }}>color {color}</button>
            <button appearance={category === 'tops' ? "primary" : "secondary"} onPress={setNewCategory('tops')}>tops ({tops_iterator})</button>
            <button appearance={category === 'bottoms' ? "primary" : "secondary"} onPress={setNewCategory('bottoms')}>bottoms ({bottoms_iterator})</button>
          </hstack>
          <hstack gap="medium">
            <button appearance="success" onPress={async function () {
              if (
                bottoms_iterator === 0 &&
                glasses_iterator === 0 &&
                grippables_iterator === 0
                && hats_iterator === 0 &&
                tops_iterator === 0) {
                if (!await context.settings.get('basicWhite')) {
                  return context.ui.showToast('please be more creative');
                }
              }
              context.ui.showForm(titleForm);
            }}>post it!</button>
          </hstack>
        </>;
        break;
    }
    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <image imageWidth={400} imageHeight={400} width="200px" height="200px" url={svgElement.output} />
        {insertion}
      </vstack>
    );
  },
});

export default Devvit;
