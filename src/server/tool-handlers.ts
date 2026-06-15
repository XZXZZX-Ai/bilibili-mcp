import { getVideoCommentsData } from "../bilibili/comments.js";
import { checkLoginStatus } from "../bilibili/http.js";
import { getVideoMetadataData } from "../bilibili/metadata.js";
import {
  getVideoInfoWithSubtitle,
  getVideoTranscriptData,
} from "../bilibili/subtitle.js";
import { getPreferredLanguage } from "../config.js";
import {
  buildCredentialNextSteps,
  buildCredentialSetupInstructions,
  buildCredentialStatus,
} from "../utils/credential-guidance.js";
import { BilibiliAPIError, NoSubtitleError } from "../utils/errors.js";
import { sanitizeBVInput } from "../utils/sanitization.js";
import {
  validateBVInput,
  validateCommentLimit,
  validateCommentSort,
  validateDetailLevel,
  validateLanguage,
} from "../utils/validation.js";
import {
  buildValidationErrorPayload,
  toErrorTextContent,
  toTextContent,
} from "./error-response.js";

type ToolArgs = Record<string, unknown> | undefined;

export async function handleToolCall(name: string, args: ToolArgs) {
  switch (name) {
    case "get_credential_setup_instructions": {
      return toTextContent(buildCredentialSetupInstructions());
    }

    case "check_bilibili_credentials": {
      const result = await buildCredentialStatus(checkLoginStatus);
      return toTextContent(result);
    }

    case "get_video_info": {
      const bvidOrUrl = args?.bvid_or_url as string;
      const preferredLang = args?.preferred_lang as string | undefined;

      let sanitizedBvidOrUrl: string;
      try {
        validateBVInput(bvidOrUrl);
        validateLanguage(preferredLang);
        sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);
      } catch (error) {
        return toErrorTextContent(buildValidationErrorPayload(error));
      }

      const normalizedLang = getPreferredLanguage(preferredLang);
      const result = await getVideoInfoWithSubtitle(sanitizedBvidOrUrl, normalizedLang);

      return toTextContent(result);
    }

    case "get_video_comments": {
      const bvidOrUrl = args?.bvid_or_url as string;
      const detailLevel = (args?.detail_level as "brief" | "detailed") || "brief";
      const limit = args?.limit as number | undefined;
      const sort = args?.sort as "hot" | "time" | undefined;
      const includeReplies = args?.include_replies as boolean | undefined;

      let sanitizedBvidOrUrl: string;
      try {
        validateBVInput(bvidOrUrl);
        validateDetailLevel(detailLevel);
        if (limit !== undefined) validateCommentLimit(limit);
        if (sort !== undefined) validateCommentSort(sort);
        if (includeReplies !== undefined && typeof includeReplies !== "boolean") {
          throw new Error("include_replies must be a boolean");
        }
        sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);
      } catch (error) {
        return toErrorTextContent(buildValidationErrorPayload(error));
      }

      const result = await getVideoCommentsData(sanitizedBvidOrUrl, {
        detailLevel,
        limit,
        sort,
        includeReplies,
      });

      return toTextContent(result);
    }

    case "get_video_transcript": {
      const bvidOrUrl = args?.bvid_or_url as string;
      const preferredLang = args?.preferred_lang as string | undefined;
      const fallbackToDescription = (args?.fallback_to_description as boolean) || false;

      let sanitizedBvidOrUrl: string;
      try {
        validateBVInput(bvidOrUrl);
        validateLanguage(preferredLang);
        if (args?.fallback_to_description !== undefined && typeof args.fallback_to_description !== "boolean") {
          throw new Error("fallback_to_description must be a boolean");
        }
        sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);
      } catch (error) {
        return toErrorTextContent(buildValidationErrorPayload(error));
      }

      const normalizedLang = getPreferredLanguage(preferredLang);

      try {
        const result = await getVideoTranscriptData(sanitizedBvidOrUrl, normalizedLang, fallbackToDescription);
        return toTextContent(result);
      } catch (error) {
        if (error instanceof NoSubtitleError) {
          return toErrorTextContent({
            error: true,
            message: error.message,
            code: "SUBTITLE_UNAVAILABLE",
            next_steps: [
              "If you expected subtitles, configure Bilibili Cookies.",
              ...buildCredentialNextSteps(),
              "Or retry get_video_transcript with fallback_to_description: true if description fallback is acceptable.",
            ],
          });
        }
        if (error instanceof BilibiliAPIError && error.code === "COOKIE_EXPIRED") {
          return toErrorTextContent({
            error: true,
            message: error.message,
            code: "COOKIE_EXPIRED",
            next_steps: buildCredentialNextSteps(),
          });
        }
        throw error;
      }
    }

    case "get_video_metadata": {
      const bvidOrUrl = args?.bvid_or_url as string;

      let sanitizedBvidOrUrl: string;
      try {
        validateBVInput(bvidOrUrl);
        sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);
      } catch (error) {
        return toErrorTextContent(buildValidationErrorPayload(error));
      }

      const result = await getVideoMetadataData(sanitizedBvidOrUrl);

      return toTextContent(result);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
