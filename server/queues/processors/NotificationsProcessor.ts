import { Minute } from "@shared/utils/time";
import {
  CollectionEvent,
  RevisionEvent,
  Event,
  DocumentEvent,
  CommentEvent,
  CollectionUserEvent,
  DocumentUserEvent,
} from "@server/types";
import CollectionAddUserNotificationsTask from "../tasks/CollectionAddUserNotificationsTask";
import CollectionCreatedNotificationsTask from "../tasks/CollectionCreatedNotificationsTask";
import CommentCreatedNotificationsTask from "../tasks/CommentCreatedNotificationsTask";
import CommentUpdatedNotificationsTask from "../tasks/CommentUpdatedNotificationsTask";
import DocumentAddUserNotificationsTask from "../tasks/DocumentAddUserNotificationsTask";
import DocumentPublishedNotificationsTask from "../tasks/DocumentPublishedNotificationsTask";
import RevisionCreatedNotificationsTask from "../tasks/RevisionCreatedNotificationsTask";
import BaseProcessor from "./BaseProcessor";

export default class NotificationsProcessor extends BaseProcessor {
  static applicableEvents: Event["name"][] = [
    "documents.publish",
    "documents.add_user",
    "revisions.create",
    "collections.create",
    "collections.add_user",
    "comments.create",
    "comments.update",
  ];

  async perform(event: Event) {
    switch (event.name) {
      case "documents.publish":
        return this.documentPublished(event);
      case "documents.add_user":
        return this.documentAddUser(event);
      case "revisions.create":
        return this.revisionCreated(event);
      case "collections.create":
        return this.collectionCreated(event);
      case "collections.add_user":
        return this.collectionAddUser(event);
      case "comments.create":
        return this.commentCreated(event);
      case "comments.update":
        return this.commentUpdated(event);
      default:
    }
  }

  async documentPublished(event: DocumentEvent) {
    // never send notifications when batch importing
    if (
      "data" in event &&
      "source" in event.data &&
      event.data.source === "import"
    ) {
      return;
    }

    await DocumentPublishedNotificationsTask.schedule(event);
  }

  async documentAddUser(event: DocumentUserEvent) {
    if (!event.data.isNew || event.userId === event.actorId) {
      return;
    }

    await DocumentAddUserNotificationsTask.schedule(event, {
      delay: Minute,
    });
  }

  async revisionCreated(event: RevisionEvent) {
    await RevisionCreatedNotificationsTask.schedule(event);
  }

  async collectionCreated(event: CollectionEvent) {
    // never send notifications when batch importing
    if (
      "data" in event &&
      "source" in event.data &&
      event.data.source === "import"
    ) {
      return;
    }

    await CollectionCreatedNotificationsTask.schedule(event);
  }

  async collectionAddUser(event: CollectionUserEvent) {
    if (!event.data.isNew || event.userId === event.actorId) {
      return;
    }

    await CollectionAddUserNotificationsTask.schedule(event, {
      delay: Minute,
    });
  }

  async commentCreated(event: CommentEvent) {
    await CommentCreatedNotificationsTask.schedule(event, {
      delay: Minute,
    });
  }

  async commentUpdated(event: CommentEvent) {
    await CommentUpdatedNotificationsTask.schedule(event, {
      delay: Minute,
    });
  }
}
