import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is missing from .env file"
    )


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# GEMINI MODEL
# =========================================================

MODEL_NAME = "gemini-3.1-flash-lite"


# =========================================================
# RETRY SETTINGS
# =========================================================

MAX_RETRIES = 3
RETRY_DELAY = 5


# =========================================================
# AI SUMMARY FUNCTION
# =========================================================

def generate_ai_summary(
    transcript: str,
    language: str = "English",
    detail_level: str = "balanced"
):

    # -----------------------------------------------------
    # Validate transcript
    # -----------------------------------------------------

    if not transcript or not transcript.strip():

        return {
            "success": False,
            "summary": "",
            "keyPoints": [],
            "actionItems": [],
            "topics": [],
            "language": language,
            "model": MODEL_NAME,
            "error": "Transcript is empty."
        }


    # -----------------------------------------------------
    # Clean transcript
    # -----------------------------------------------------

    transcript = transcript.strip()


    # -----------------------------------------------------
    # Limit transcript size
    # -----------------------------------------------------

    MAX_TRANSCRIPT_LENGTH = 12000

    if len(transcript) > MAX_TRANSCRIPT_LENGTH:

        transcript = transcript[:MAX_TRANSCRIPT_LENGTH]

        transcript += (
            "\n\n[Transcript shortened because it was very long.]"
        )


    # -----------------------------------------------------
    # Detail level
    # -----------------------------------------------------

    if detail_level == "short":

        summary_instruction = """
Give a very short summary.
Keep only the most important information.
"""

    elif detail_level == "detailed":

        summary_instruction = """
Give a detailed but concise summary.
Include the important information and main ideas.
"""

    else:

        summary_instruction = """
Give a balanced summary.
Keep it clear, useful and concise.
"""


    # -----------------------------------------------------
    # Gemini Prompt
    # -----------------------------------------------------

    prompt = f"""
You are an AI Voice Note Summarizer.

Summarize the following transcript in {language}.

{summary_instruction}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "summary": "Short summary",
    "keyPoints": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ],
    "actionItems": [
        "Action item 1"
    ],
    "topics": [
        "Topic 1",
        "Topic 2"
    ]
}}

Rules:

1. Write the summary in {language}.
2. Write key points in {language}.
3. Write action items in {language}.
4. Write topics in {language}.
5. Keep the summary concise.
6. Extract the most important key points.
7. Add action items only if they exist.
8. Add important topics.
9. Do not add Markdown.
10. Do not add explanations outside JSON.
11. Return valid JSON only.

Transcript:

{transcript}
"""


    # =====================================================
    # CALL GEMINI WITH RETRY
    # =====================================================

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            print("")
            print(
                f"Gemini request attempt "
                f"{attempt}/{MAX_RETRIES}"
            )

            response = client.models.generate_content(

                model=MODEL_NAME,

                contents=prompt,

                config=types.GenerateContentConfig(

                    temperature=0.2,

                    max_output_tokens=800,

                    response_mime_type="application/json"
                )
            )


            # -------------------------------------------------
            # Get response text
            # -------------------------------------------------

            response_text = response.text

            if not response_text:

                return {
                    "success": False,
                    "summary": "",
                    "keyPoints": [],
                    "actionItems": [],
                    "topics": [],
                    "language": language,
                    "model": MODEL_NAME,
                    "error": "Gemini returned an empty response."
                }


            # -------------------------------------------------
            # Parse JSON
            # -------------------------------------------------

            try:

                result = json.loads(response_text)

            except json.JSONDecodeError:

                cleaned_text = response_text.strip()


                if cleaned_text.startswith("```json"):

                    cleaned_text = cleaned_text[
                        len("```json"):
                    ]


                if cleaned_text.startswith("```"):

                    cleaned_text = cleaned_text[
                        len("```"):
                    ]


                if cleaned_text.endswith("```"):

                    cleaned_text = cleaned_text[
                        :-len("```")
                    ]


                cleaned_text = cleaned_text.strip()


                try:

                    result = json.loads(cleaned_text)

                except json.JSONDecodeError:

                    return {
                        "success": False,
                        "summary": response_text,
                        "keyPoints": [],
                        "actionItems": [],
                        "topics": [],
                        "language": language,
                        "model": MODEL_NAME,
                        "error": "Gemini returned invalid JSON."
                    }


            # -------------------------------------------------
            # Get result fields
            # -------------------------------------------------

            summary = result.get(
                "summary",
                ""
            )

            key_points = result.get(
                "keyPoints",
                []
            )

            action_items = result.get(
                "actionItems",
                []
            )

            topics = result.get(
                "topics",
                []
            )


            # -------------------------------------------------
            # Make sure summary exists
            # -------------------------------------------------

            if not summary:

                return {
                    "success": False,
                    "summary": "",
                    "keyPoints": key_points,
                    "actionItems": action_items,
                    "topics": topics,
                    "language": language,
                    "model": MODEL_NAME,
                    "error": "Gemini returned an empty summary."
                }


            # -------------------------------------------------
            # Successful response
            # -------------------------------------------------

            print("")
            print("Gemini summary generated successfully.")
            print("Model:", MODEL_NAME)
            print("")


            return {

                "success": True,

                "summary": summary,

                "keyPoints": key_points,

                "actionItems": action_items,

                "topics": topics,

                "language": language,

                "model": MODEL_NAME
            }


        # =====================================================
        # GEMINI API ERROR
        # =====================================================

        except errors.APIError as e:

            print("")
            print("Gemini API Error:")
            print(e)
            print("")


            error_code = getattr(
                e,
                "code",
                None
            )


            # -------------------------------------------------
            # Retry for temporary server errors
            # -------------------------------------------------

            if error_code in [429, 500, 502, 503, 504]:

                if attempt < MAX_RETRIES:

                    print(
                        "Gemini is temporarily unavailable."
                    )

                    print(
                        f"Waiting {RETRY_DELAY} seconds "
                        "before retry..."
                    )

                    time.sleep(RETRY_DELAY)

                    continue


                return {

                    "success": False,

                    "summary": "",

                    "keyPoints": [],

                    "actionItems": [],

                    "topics": [],

                    "language": language,

                    "model": MODEL_NAME,

                    "error": (
                        "Gemini API is temporarily unavailable "
                        "after multiple attempts. "
                        f"Please try again later. "
                        f"Original error: {e}"
                    )
                }


            # -------------------------------------------------
            # Other Gemini errors
            # -------------------------------------------------

            return {

                "success": False,

                "summary": "",

                "keyPoints": [],

                "actionItems": [],

                "topics": [],

                "language": language,

                "model": MODEL_NAME,

                "error": f"Gemini API error: {e}"
            }


        # =====================================================
        # GENERAL ERROR
        # =====================================================

        except Exception as e:

            print("")
            print("Gemini Error:")
            print(e)
            print("")


            return {

                "success": False,

                "summary": "",

                "keyPoints": [],

                "actionItems": [],

                "topics": [],

                "language": language,

                "model": MODEL_NAME,

                "error": str(e)
            }


    # =========================================================
    # FINAL FALLBACK
    # =========================================================

    return {

        "success": False,

        "summary": "",

        "keyPoints": [],

        "actionItems": [],

        "topics": [],

        "language": language,

        "model": MODEL_NAME,

        "error": "Gemini request failed."
    }


# =========================================================
# DIRECT TEST
# =========================================================

if __name__ == "__main__":

    test_transcript = """
    Today we discussed the AI Voice Note Summarizer project.
    The project converts voice recordings into text and generates
    an AI-based summary. We also discussed multilingual support,
    history, key points and action items.
    """


    result = generate_ai_summary(

        transcript=test_transcript,

        language="English",

        detail_level="balanced"
    )


    print("")
    print("==============================")
    print("AI SUMMARY TEST")
    print("==============================")


    print(
        json.dumps(
            result,
            indent=4,
            ensure_ascii=False
        )
    )