import mongoose from "mongoose";
import config from "../src/config";
import { UserModel } from "../src/app/modules/User/user.model";
import { PostModel } from "../src/app/modules/Post/post.model";

const posts = [
  {
    title: "Why private notes beat shared docs for first drafts",
    content:
      "I write every first draft in a private note. No comments, no sharing, no pressure. When the idea is solid I publish a short public post. That split keeps thinking honest.",
  },
  {
    title: "A simple weekly review that actually sticks",
    content:
      "Friday afternoon: scan the week's notes, star three that still matter, archive the rest. Ten minutes. The habit only works because the notes stay private until I choose otherwise.",
  },
  {
    title: "JWT sessions without storing passwords in the client",
    content:
      "Access tokens live in httpOnly cookies. The browser never reads them in JavaScript. Refresh happens on 401. Role still comes from the server, never from localStorage.",
  },
  {
    title: "Role-based access in a notes app",
    content:
      "USER can only query their own notes. ADMIN can list every note for support, but regular users never see each other's private content. Ownership is always taken from the JWT.",
  },
  {
    title: "Indexes that match real queries",
    content:
      "We index { userId, createdAt } on notes because lists are always scoped to the owner and sorted newest first. Email uniqueness is enough for login. No unused indexes.",
  },
  {
    title: "Aggregation: users grouped by interest",
    content:
      "One pipeline: unwind interests, group by interest, project the user list, sort. That is Scenario 1. It is cheaper than loading every user into Node and grouping in memory.",
  },
  {
    title: "Aggregation: posts with $lookup",
    content:
      "Scenario 2 loads a user and their public posts in a single aggregate. The foreign field is posts.userId, so that field is indexed. No N+1 queries.",
  },
  {
    title: "Writing in the morning vs at night",
    content:
      "Morning notes are plans. Night notes are leftovers and worries. I keep both, but I only publish the morning ones. The rest stay private on purpose.",
  },
  {
    title: "How I title notes so I can find them later",
    content:
      "Verb plus object: 'Rewrite login copy', 'Fix pagination on admin users'. Dates in the title are noise. The timestamp is already on the document.",
  },
  {
    title: "Bcrypt and why we never return the hash",
    content:
      "Password is select:false on the user model. Compare happens in the service. Public register always creates USER. Admins are seeded or created by another admin.",
  },
  {
    title: "Pagination that does not surprise anyone",
    content:
      "Every list returns page, limit, total, and totalPages. Limit is capped at 100. Empty pages return an empty array, not an error.",
  },
  {
    title: "Skeletons instead of spinners",
    content:
      "First load shows the shape of the page: metric row, note cards, or a table. Refetch does not flash a spinner over existing data. Empty state waits until loading is done.",
  },
  {
    title: "Mobile notes: full bleed, large tap targets",
    content:
      "On a phone the floating desktop chrome goes away. The sidebar becomes a drawer. Buttons are at least 44px. Inputs stay at 16px so iOS does not zoom.",
  },
  {
    title: "What I keep in public posts",
    content:
      "Public posts are opinions and how-tos. Private notes are names, drafts, and anything I would not put on a shared screen. If I hesitate, it stays a note.",
  },
  {
    title: "A checklist before shipping auth",
    content:
      "Hash passwords. Force USER on public register. Put userId in the JWT. Read ownership from the token, not the body. Clear cookies on logout. Rotate refresh tokens.",
  },
  {
    title: "Interests as a multi-select",
    content:
      "Free-text comma lists were messy. A searchable select with a fixed list keeps grouping clean for the admin aggregation and still lets you pick more than one.",
  },
  {
    title: "Reading notes on a small screen",
    content:
      "Title wraps. Edit and delete stack full width. The note body keeps comfortable line height. No horizontal scroll, no tiny icon-only actions.",
  },
  {
    title: "Why admin can see all notes",
    content:
      "Support and moderation need a global view. Users still cannot open another person's /notes/:id. The admin list is a separate route with a role guard.",
  },
  {
    title: "Draft in private, publish when ready",
    content:
      "I treat notes as a workshop and posts as a shop window. Twenty public posts is a nice archive. The unfinished work never leaves my account.",
  },
  {
    title: "One workspace, two audiences",
    content:
      "Private notes are for me. Public posts are for anyone with the URL. Same account, same design, different visibility. That is the whole product.",
  },
];

async function seed() {
  await mongoose.connect(config.database_url as string);

  const users = await UserModel.find().select("_id email name role").lean();
  if (!users.length) {
    throw new Error("No users found. Register or seed an admin first.");
  }

  const owner =
    users.find((user) => user.email === config.password.admin_email) || users[0];

  const created = await PostModel.insertMany(
    posts.map((post) => ({
      ...post,
      userId: owner._id,
    }))
  );

  console.log(`Created ${created.length} posts for ${owner.name} <${owner.email}> (${owner._id})`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
