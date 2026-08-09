import json
import logging
import google.generativeai as genai
from app.config import Config

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if not Config.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is missing from configuration environment.")
        else:
            genai.configure(api_key=Config.GEMINI_API_KEY)
            logger.info("Google Gemini AI SDK configured successfully.")

    def _call_gemini(self, system_prompt, user_prompt, response_mime_type=None):
        if not Config.GEMINI_API_KEY:
            raise ValueError(
                "Google Gemini API key is not configured. Please configure GEMINI_API_KEY environment variable."
            )
            
        import hashlib
        import time
        from flask import has_app_context, g
        
        # Calculate SHA256 prompt hash for caching
        cache_key = hashlib.sha256(
            (system_prompt or "").encode("utf-8") + b"::" +
            (user_prompt or "").encode("utf-8") + b"::" +
            (str(response_mime_type) or "").encode("utf-8")
        ).hexdigest()
        
        from app.utils.db import get_db
        db = get_db()
        cache_col = db.get_collection("gemini_cache")
        
        # Performance measurement
        start_cache = time.time()
        cached_record = cache_col.find_one({"_id": cache_key})
        cache_duration = time.time() - start_cache
        if has_app_context():
            g.db_query_time = getattr(g, "db_query_time", 0.0) + cache_duration
            
        if cached_record:
            logger.info("Gemini Cache Hit! Returning cached response.")
            return cached_record["response"]
            
        model_name = Config.GEMINI_MODEL or "gemini-flash-lite-latest"
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )
        
        gen_config = {}
        if response_mime_type:
            gen_config["response_mime_type"] = response_mime_type
            
        import traceback
        
        try:
            tokens_info = model.count_tokens(user_prompt)
            token_count = tokens_info.total_tokens if tokens_info else 0
        except Exception:
            token_count = 0
            
        logger.info(f"Gemini Request Start: Model={model_name} | Prompt Token Count={token_count}")
        start_time = time.time()
        
        max_retries = 2
        delay = 2.5
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    user_prompt,
                    generation_config=gen_config,
                    request_options={"timeout": 60}
                )
                
                execution_time = time.time() - start_time
                logger.info(f"Gemini Request End: Success in {execution_time:.2f}s")
                
                if has_app_context():
                    g.gemini_time = getattr(g, "gemini_time", 0.0) + execution_time
                
                if response and response.text:
                    res_text = response.text
                    # Save to cache
                    try:
                        start_save = time.time()
                        cache_col.update_one(
                            {"_id": cache_key},
                            {"$set": {
                                "system_prompt": system_prompt,
                                "user_prompt": user_prompt,
                                "response": res_text,
                                "created_at": time.time()
                            }},
                            upsert=True
                        )
                        save_duration = time.time() - start_save
                        if has_app_context():
                            g.db_query_time = getattr(g, "db_query_time", 0.0) + save_duration
                    except Exception as cache_err:
                        logger.error(f"Failed to write to Gemini cache: {cache_err}")
                    return res_text
                raise RuntimeError("Google Gemini API returned an empty response.")
                
            except Exception as e:
                execution_time = time.time() - start_time
                if has_app_context():
                    g.gemini_time = getattr(g, "gemini_time", 0.0) + execution_time
                    
                err_msg = str(e)
                http_status = "Unknown"
                if hasattr(e, "code"):
                    http_status = str(e.code)
                    
                logger.error(
                    f"Gemini Request Error (Attempt {attempt+1}/{max_retries}) in {execution_time:.2f}s "
                    f"| HTTP Status={http_status}: {err_msg}"
                )
                logger.error(traceback.format_exc())
                
                is_retryable = (
                    "429" in err_msg or 
                    "quota" in err_msg.lower() or 
                    "limit" in err_msg.lower() or 
                    "timeout" in err_msg.lower() or 
                    "deadline" in err_msg.lower() or
                    "503" in err_msg or
                    "unavailable" in err_msg.lower()
                )
                if is_retryable and attempt < max_retries - 1:
                    logger.warning(f"Retryable error hit. Sleeping {delay}s and retrying...")
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise e

    def chat_tutor(self, messages, mode="general", user_profile=None, notes_context="", pdf_context="", quiz_context=""):
        profile_details = ""
        if user_profile:
            profile_details = (
                f"- Student Name: {user_profile.get('name', 'Student')}\n"
                f"- Academic Department: {user_profile.get('department', 'Computer Science')}\n"
                f"- Current Semester: {user_profile.get('semester', '1')}\n"
                f"- Study Interests: {', '.join(user_profile.get('study_interests', [])) if user_profile.get('study_interests') else 'None'}\n"
                f"- Learning Style: {user_profile.get('learning_style', 'Visual')}\n"
                f"- Target Career: {user_profile.get('target_role', 'Software Engineer')} at {user_profile.get('target_company', 'Tech Firm')}\n"
            )
            
        mode_prompts = {
            "general": "You are a StudySphere General Academic Mentor. Explain using simple language with examples and summary.",
            "programming": "You are a programming mentor. Explain with code examples, Time/Space Complexity (Big-O), and best practices.",
            "cyber": "You are a cybersecurity mentor. Explain with definition, realistic attack example, and mitigation steps. Focus on defensive secure coding.",
            "resume": "You are a CV reviewer. Provide ATS suggestions, before/after phrasing examples, and recruiter tips.",
            "interview": "You are an interview coach. Construct a STAR Answer, Sample Answer, and follow-up questions.",
            "career": "You are a career advisor. Generate learning roadmap, skills, certifications, and resources."
        }
        
        mode_instruction = mode_prompts.get(mode.lower(), mode_prompts["general"])
        system_prompt = (
            f"You are StudySphere AI, a personalized intelligence mentor.\n\n"
            f"### Personalization context:\n{profile_details}\n"
            f"### Mode specific role:\n{mode_instruction}\n"
        )
        
        rag_context = ""
        if notes_context:
            rag_context += f"\n[RELEVANT NOTES CONTEXT]:\n{notes_context}\n"
        if pdf_context:
            rag_context += f"\n[RELEVANT TEXTBOOK CONTEXT]:\n{pdf_context}\n"
        if quiz_context:
            rag_context += f"\n[RECENT STUDY METRICS / QUIZ SCORE PERFORMANCE]:\n{quiz_context}\n"
            
        if rag_context:
            system_prompt += f"\n### Retrieved Learning Context:\n{rag_context}\n"
            
        user_prompt = ""
        for msg in messages[-6:]:
            user_prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
            
        return self._call_gemini(system_prompt, user_prompt)

    def summarize_notes(self, content, mode="summary"):
        prompt_map = {
            "summary": "Summarize the following text clearly in a concise paragraph and list the top 3 core takeaways.",
            "rewrite": "Rewrite the following text to make it highly professional, clean, and easy to read. Maintain formatting.",
            "bullets": "Convert the following text into key bullet points, grouping concepts logically.",
            "revision": "Convert this content into active recall revision notes, including Q&A-style prompt items."
        }
        instruction = prompt_map.get(mode, prompt_map["summary"])
        system_prompt = "You are an expert academic editor."
        user_prompt = f"{instruction}\n\nCONTENT:\n{content}"
        return self._call_gemini(system_prompt, user_prompt)

    def ask_pdf(self, question, retrieved_chunks):
        default_not_found = {
            "answer": "The requested information is not available in the uploaded document.",
            "page_number": None,
            "chapter_name": None,
            "source_citation": None,
            "highlighted_paragraph": None,
            "not_found": True
        }
        
        if not retrieved_chunks:
            return json.dumps(default_not_found)
            
        context_blocks = ""
        for idx, chunk in enumerate(retrieved_chunks):
            context_blocks += f"[Context Segment {idx+1} (Page {chunk.get('page')}, Chapter '{chunk.get('chapter')}')]:\n{chunk.get('text')}\n\n"
            
        system_prompt = (
            "You are an AI Tutor assistant reading a PDF textbook. Use the provided context passages "
            "to answer the question. You MUST answer the question using ONLY the provided context. "
            "Do not use external knowledge or fabricate facts.\n\n"
            "You must respond with a JSON object containing the following keys:\n"
            "- 'answer': A clear, detailed answer to the question in markdown format.\n"
            "- 'page_number': The page number(s) (as a number or a list/string) where the answer was found.\n"
            "- 'chapter_name': The chapter name(s) where the answer was found.\n"
            "- 'source_citation': A formal citation of the source (e.g. 'Chapter 2, Page 5').\n"
            "- 'highlighted_paragraph': The exact paragraph or sentence from the context that contains the answer.\n"
            "- 'not_found': A boolean. Set to true if the context does not contain the answer to the question.\n\n"
            "If the answer is not in the context, set 'not_found' to true, and set 'answer' to "
            "'The requested information is not available in the uploaded document.' and leave other fields blank or null. "
            "Ensure the output is valid JSON and only the JSON object."
        )
        user_prompt = f"RETRIEVED CONTEXT:\n{context_blocks}\n\nQUESTION: {question}"
        
        try:
            res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
            parsed = json.loads(res)
            return json.dumps(parsed)
        except Exception as e:
            logger.error(f"Error in ask_pdf Gemini call: {e}")
            return json.dumps(default_not_found)

    def generate_embeddings(self, texts):
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")
        if not texts:
            return []
        
        is_single = isinstance(texts, str)
        texts_list = [texts] if is_single else texts
        
        import google.generativeai as genai
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=texts_list,
                task_type="retrieval_document"
            )
            embeddings = result.get('embedding', [])
            return embeddings[0] if is_single else embeddings
        except Exception as e:
            logger.error(f"Error generating Gemini embeddings: {e}")
            fallback_vector = [0.0] * 768
            return fallback_vector if is_single else [fallback_vector] * len(texts_list)

    def summarize_section(self, section_text, section_num):
        system_prompt = (
            "You are a professional academic editor. Analyze the textbook section provided below. "
            "Provide a concise summary, key concepts, definitions, real-world examples, and formulae. "
            "Respond with a JSON object containing the keys:\n"
            "- 'summary': A 1-2 paragraph description of the section.\n"
            "- 'concepts': A list of key concepts discussed in this section.\n"
            "- 'definitions': A list of objects { 'term': '...', 'definition': '...' }.\n"
            "- 'examples': A list of real-world examples mentioned.\n"
            "- 'formulae': A list of equations or formulae (if any).\n"
            "- 'difficulty': 'Easy', 'Medium', or 'Hard'."
        )
        user_prompt = f"SECTION CONTENT (Part {section_num}):\n\n{section_text}"
        try:
            res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
            return json.loads(res)
        except Exception as e:
            logger.error(f"Error in summarize_section: {e}")
            return {
                "summary": "Summary unavailable.",
                "concepts": [],
                "definitions": [],
                "examples": [],
                "formulae": [],
                "difficulty": "Medium"
            }

    def reduce_summaries(self, section_summaries, title, total_pages):
        summaries_text = ""
        for idx, sec in enumerate(section_summaries):
            summaries_text += f"--- Section {idx+1} Summary ---\n{json.dumps(sec, indent=2)}\n\n"
            
        system_prompt = (
            "You are an expert academic curator. You are given a list of section summaries from a textbook.\n"
            "Your job is to compile them into a unified, professional, highly-detailed study dashboard JSON object.\n\n"
            "You MUST respond with a JSON object matching this exact structure, filling it with content "
            "derived from the section summaries. Do not return any text outside the JSON.\n\n"
            "JSON Structure:\n"
            "{\n"
            "  \"title\": \"Global Title of Document\",\n"
            "  \"executive_summary\": \"A 200-300 word detailed executive summary of the entire document.\",\n"
            "  \"learning_objectives\": [\"Objective 1\", \"Objective 2\", \"Objective 3\"],\n"
            "  \"key_concepts\": [\n"
            "    { \"concept\": \"Concept Name\", \"explanation\": \"Detailed explanation\" }\n"
            "  ],\n"
            "  \"important_definitions\": [\n"
            "    { \"term\": \"Term\", \"definition\": \"Clear definition\" }\n"
            "  ],\n"
            "  \"important_points\": [\"Core point 1\", \"Core point 2\", \"Core point 3\"],\n"
            "  \"main_ideas\": [\"Main idea 1\", \"Main idea 2\"],\n"
            "  \"key_takeaways\": [\"Takeaway 1\", \"Takeaway 2\"],\n"
            "  \"faqs\": [\n"
            "    { \"question\": \"Question?\", \"answer\": \"Answer\" }\n"
            "  ],\n"
            "  \"interview_questions\": [\n"
            "    { \"question\": \"Question?\", \"answer\": \"Detailed answer\" }\n"
            "  ],\n"
            "  \"chapters\": [\n"
            "    {\n"
            "      \"chapter_name\": \"Chapter X: Name\",\n"
            "      \"page_start\": 1,\n"
            "      \"summary\": \"Detailed summary of this chapter/section\",\n"
            "      \"concepts\": [\"Chapter Concept\"],\n"
            "      \"definitions\": [{ \"term\": \"Term\", \"definition\": \"Definition\" }],\n"
            "      \"examples\": [\"Example\"],\n"
            "      \"formulae\": [\"Formula (if any)\"],\n"
            "      \"revision_notes\": \"Detailed summary notes for revision\",\n"
            "      \"difficulty_level\": \"Easy/Medium/Hard\",\n"
            "      \"expected_exam_questions\": [\"Question 1\", \"Question 2\"]\n"
            "    }\n"
            "  ],\n"
            "  \"study_tools\": {\n"
            "    \"flashcards\": [\n"
            "      { \"front\": \"Flashcard Question/Term\", \"back\": \"Flashcard Answer/Definition\" }\n"
            "    ],\n"
            "    \"quiz\": [\n"
            "      {\n"
            "        \"question\": \"Multiple choice question text?\",\n"
            "        \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "        \"correct_answer\": \"Option A\",\n"
            "        \"explanation\": \"Why Option A is correct\"\n"
            "      }\n"
            "    ],\n"
            "    \"mind_map\": {\n"
            "      \"topic\": \"Root Topic Name\",\n"
            "      \"subtopics\": [\n"
            "        { \"name\": \"Subtopic Name\", \"items\": [\"Sub-item 1\", \"Sub-item 2\"] }\n"
            "      ]\n"
            "    },\n"
            "    \"cheat_sheet\": \"Concise revision cheat sheet summarizing formulas and definitions.\",\n"
            "    \"important_questions\": [\"Revision question 1\", \"Revision question 2\"]\n"
            "  }\n"
            "}"
        )
        
        user_prompt = (
            f"TEXTBOOK DETAILS:\n- Title: {title}\n- Total Pages: {total_pages}\n\n"
            f"SECTION SUMMARIES:\n{summaries_text}"
        )
        
        try:
            res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
            return json.loads(res)
        except Exception as e:
            logger.error(f"Error in reduce_summaries: {e}")
            return {
                "title": title,
                "executive_summary": "Summary generation failed.",
                "learning_objectives": ["Understand the core concepts of " + title],
                "key_concepts": [],
                "important_definitions": [],
                "important_points": [],
                "main_ideas": [],
                "key_takeaways": [],
                "faqs": [],
                "interview_questions": [],
                "chapters": [],
                "study_tools": {
                    "flashcards": [],
                    "quiz": [],
                    "mind_map": {
                        "topic": title,
                        "subtopics": []
                    },
                    "cheat_sheet": "N/A",
                    "important_questions": []
                }
            }


    def generate_quiz(self, subject, difficulty, count=5, quiz_type="mcq"):
        system_prompt = (
            "You are an academic testing system. You must output a JSON object containing "
            "a list of quiz questions. Follow this exact format:\n"
            "{\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"question\": \"Question text here?\",\n"
            "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "      \"correct_answer\": \"Option A\",\n"
            "      \"explanation\": \"Why Option A is correct.\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Ensure options has 4 items. For true/false, make options: ['True', 'False']."
        )
        user_prompt = f"Generate a {difficulty} level {quiz_type} quiz on '{subject}' containing {count} questions."
        
        res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
        parsed = json.loads(res)
        for q in parsed.get("questions", []):
            if "correct_answer" in q and "answer" not in q:
                q["answer"] = q["correct_answer"]
            elif "answer" in q and "correct_answer" not in q:
                q["correct_answer"] = q["answer"]
        return parsed

    def generate_flashcards(self, category, text_input=None):
        system_prompt = (
            "You are a study card creator. Create a JSON list of flashcards. Exact output format:\n"
            "{\n"
            "  \"cards\": [\n"
            "    { \"front\": \"Term/Question\", \"back\": \"Definition/Answer\" }\n"
            "  ]\n"
            "}"
        )
        user_prompt = f"Create 5 flashcards for study category '{category}' based on: {text_input or 'core terms'}"
        res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
        return json.loads(res)

    def explain_code(self, code, language):
        system_prompt = (
            f"You are an expert compiler and AI Code reviewer. Analyze this {language} code. "
            "Output your analysis in Markdown. Include sections: "
            "1. Complexity (Big O for Time and Space), "
            "2. Potential Bugs & Optimization suggestions, "
            "3. Optimized alternative solution code block."
        )
        user_prompt = f"CODE:\n```\n{code}\n```"
        return self._call_gemini(system_prompt, user_prompt)

    def analyze_resume_ats(self, resume_text, target_role, job_description_text=""):
        system_prompt = (
            "You are an expert recruiter and ATS resume auditor. Analyze the provided resume text against the target role "
            "and optional job description. Return a detailed JSON object. Return EXACTLY this format and nothing else:\n"
            "{\n"
            "  \"ats_score\": 78,\n"
            "  \"job_match_pct\": 80,\n"
            "  \"keyword_match_pct\": 75,\n"
            "  \"skill_match_pct\": 82,\n"
            "  \"experience_match_pct\": 70,\n"
            "  \"education_match_pct\": 90,\n"
            "  \"match_suggestions\": [\"Add more keywords matching cloud systems.\"],\n"
            "  \"sections\": {\n"
            "     \"contact_info\": { \"found\": true, \"suggestions\": \"Include your LinkedIn URL.\" },\n"
            "     \"professional_summary\": { \"found\": true, \"suggestions\": \"Rewrite summary to showcase metrics.\" },\n"
            "     \"skills\": { \"found\": true, \"suggestions\": \"Categorize skills logically.\" },\n"
            "     \"projects\": { \"found\": true, \"suggestions\": \"Quantify project business impacts.\" },\n"
            "     \"experience\": { \"found\": true, \"suggestions\": \"Add action verbs to experience section.\" },\n"
            "     \"education\": { \"found\": true, \"suggestions\": \"Include relevant coursework tags.\" },\n"
            "     \"certifications\": { \"found\": false, \"suggestions\": \"Add cloud or cybersecurity certifications.\" },\n"
            "     \"achievements\": { \"found\": false, \"suggestions\": \"List academic honors or hackathon achievements.\" },\n"
            "     \"languages\": { \"found\": false, \"suggestions\": \"List spoken languages if international roles.\" }\n"
            "  },\n"
            "  \"keywords\": {\n"
            "     \"matched\": [\"Python\", \"Flask\", \"React\"],\n"
            "     \"missing\": [\"TypeScript\", \"Docker\", \"AWS\"],\n"
            "     \"recommended\": [\"CI/CD\", \"Redis\", \"Kubernetes\"]\n"
            "  },\n"
            "  \"formatting\": {\n"
            "     \"headings\": \"Clean and standard headings found.\",\n"
            "     \"bullets\": \"Good use of bullet points throughout.\",\n"
            "     \"dates\": \"Consistent date layouts.\",\n"
            "     \"font\": \"Clean font layout.\",\n"
            "     \"length\": \"Optimal page length (1 page).\",\n"
            "     \"whitespace\": \"Excellent white space usage.\",\n"
            "     \"ats_readability\": \"High compatibility with recruiter scanners.\"\n"
            "  },\n"
            "  \"skills_categorized\": {\n"
            "     \"languages\": [\"Python\", \"JavaScript\"],\n"
            "     \"frameworks\": [\"Flask\", \"React\"],\n"
            "     \"databases\": [\"MongoDB\", \"PostgreSQL\"],\n"
            "     \"cloud\": [\"AWS (Basic)\"],\n"
            "     \"devops\": [\"Git\", \"CI/CD\"],\n"
            "     \"security\": [\"OWASP Top 10\"],\n"
            "     \"tools\": [\"Docker\", \"VS Code\"],\n"
            "     \"soft_skills\": [\"Teamwork\", \"Problem Solving\"]\n"
            "  },\n"
            "  \"projects\": [\n"
            "     {\n"
            "        \"title\": \"StudySphere Learning Platform\",\n"
            "        \"strength_score\": 85,\n"
            "        \"tech_stack\": [\"Python\", \"Flask\", \"MongoDB\"],\n"
            "        \"impact_score\": 80,\n"
            "        \"recruiter_impression\": \"Impressive full-stack architecture.\",\n"
            "        \"action_verbs\": \"Engineered, Integrated, Optimised\",\n"
            "        \"quantified_results\": \"Reduced page load times by 25%.\",\n"
            "        \"suggestions\": [\"Elaborate on database indexing logic.\"]\n"
            "     }\n"
            "  ],\n"
            "  \"improvements\": {\n"
            "     \"professional_summary\": \"Results-driven Developer...\",\n"
            "     \"experience\": \"Initiated design schemas...\",\n"
            "     \"projects\": \"Engineered multi-threaded models...\",\n"
            "     \"skills\": \"Upgraded categories breakdown...\",\n"
            "     \"achievements\": \"Placed top 5% in competitive hackathon.\",\n"
            "     \"action_verbs\": \"Use words like Architected, Deployed, Standardized instead of helped.\",\n"
            "     \"grammar\": \"Perfect spelling and layout formatting.\",\n"
            "     \"ats_optimized_resume\": \"Fully reformatted text...\"\n"
            "  },\n"
            "  \"ai_recommendations\": {\n"
            "     \"top_missing_skills\": [\"TypeScript\", \"Docker\"],\n"
            "     \"recommended_certifications\": [\"AWS Certified Developer\"],\n"
            "     \"recommended_projects\": [\"Real-time Chat with WebSockets\"],\n"
            "     \"interview_preparation\": [\"Explain difference between SQL and NoSQL.\"],\n"
            "     \"learning_roadmap\": [\"Week 1: TypeScript basics, Week 2: Docker containers\"]\n"
            "  },\n"
            "  \"final_recommendation\": \"Good\"\n"
            "}"
        )
        user_prompt = f"RESUME TEXT:\n{resume_text}\n\nTARGET ROLE: {target_role}\n\nJOB DESCRIPTION:\n{job_description_text or 'Not Provided'}"
        res = self._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
        return json.loads(res)

    def generate_resume_assistant(self, objective_form):
        system_prompt = (
            "You are an executive CV writer and recruiter. Generate ATS-optimized career objective, "
            "skills breakdown, projects phrasing, a clean cover letter, and top 3 mock interview questions. "
            "Use Markdown sections."
        )
        user_prompt = f"TARGET JOB DETAILS:\n{json.dumps(objective_form)}"
        return self._call_gemini(system_prompt, user_prompt)

# Global AI Instance
ai_service = AIService()

def get_ai():
    return ai_service
