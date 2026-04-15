import { useState } from "react";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const INTERESTS = [
  "Art", "Biology", "Chemistry", "Engineering", "Gardening", "Geology",
  "History", "Math", "Meteorology", "Music", "Paleontology", "Photography",
  "Physics", "Robotics", "Space", "Theater",
];
const SKILLS = [
  "Bilingual", "Customer Service", "Dependable", "Live Performing",
  "Organizing & Cleaning", "Problem-Solving", "Public Speaking",
  "Teaching", "Teamwork", "Time Management",
];
const OPPORTUNITIES = [
  "Collections", "Floor Facilitation", "Gardens and Grounds",
  "Guest Relations", "Planetarium Line Control", "Security",
];
const DIETARY = ["Gluten Free", "None", "Nut Allergies", "Other", "Pork Free", "Vegan", "Vegetarian"];
const EMAIL_PREFS = ["Monthly Newsletters", "Opportunities", "Reminders", "Schedule Reminders", "Schedule Confirmations", "Other Information"];

const emptyForm = {
  first_name: "", last_name: "", title: "", kind: "Individual",
  pronouns: "", street1: "", street2: "", city: "", state: "", zip: "",
  primary_phone: "", secondary_phone: "",
  email: "",
  availability_days: {} as Record<string, string>,
  availability_type: "", availability_notes: "",
  date_of_birth: "", gender: "", age: "",
  accommodations: "", tshirt_size: "",
  dietary_restrictions: [] as string[],
  photo_release: false,
  interests: [] as string[],
  skills: [] as string[],
  opportunities: [] as string[],
  specific_positions: "",
  text_opt_in: false,
  email_preferences: [] as string[],
  agree: false,
};

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export function Apply() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agree) { setError("Please agree to the volunteer program terms."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-12 text-center shadow-md max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Application Submitted!</h2>
          <p className="text-gray-500">Thank you for applying to volunteer at Science Museum Oklahoma. We'll be in touch soon!</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";
  const sectionCls = "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1f4f99]">Volunteer Application Form</h1>
          <p className="mt-2 text-sm text-gray-500">
            Science Museum Oklahoma — Thank you for your interest in volunteering!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name & Address */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Name and Address</h2>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="kind" value="Individual" checked={form.kind === "Individual"} onChange={() => set("kind", "Individual")} /> Individual
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="kind" value="Group" checked={form.kind === "Group"} onChange={() => set("kind", "Group")} /> Group
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>First Name *</label>
                <input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>What are your pronouns?</label>
                <input value={form.pronouns} onChange={(e) => set("pronouns", e.target.value)} className={inputCls} placeholder="e.g. she/her" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Street Address *</label>
                <input required value={form.street1} onChange={(e) => set("street1", e.target.value)} className={inputCls} placeholder="Street 1" />
              </div>
              <div className="sm:col-span-2">
                <input value={form.street2} onChange={(e) => set("street2", e.target.value)} className={inputCls} placeholder="Street 2 (optional)" />
              </div>
              <div>
                <label className={labelCls}>City *</label>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State *</label>
                <input required value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} placeholder="e.g. OK" maxLength={2} />
              </div>
              <div>
                <label className={labelCls}>Zip *</label>
                <input required value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email Address *</label>
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Primary Phone</label>
                <input value={form.primary_phone} onChange={(e) => set("primary_phone", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Secondary Phone</label>
                <input value={form.secondary_phone} onChange={(e) => set("secondary_phone", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Availability</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DAYS.map((day) => (
                <div key={day}>
                  <label className={labelCls}>{day}</label>
                  <input
                    value={form.availability_days[day] || ""}
                    onChange={(e) => set("availability_days", { ...form.availability_days, [day]: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 9am–12pm"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className={labelCls}>My availability is *</label>
              <input required value={form.availability_type} onChange={(e) => set("availability_type", e.target.value)} className={inputCls} placeholder="e.g. Weekly" />
            </div>
            <div>
              <label className={labelCls}>Please explain availability (weekly, monthly, etc.) *</label>
              <textarea required value={form.availability_notes} onChange={(e) => set("availability_notes", e.target.value)} rows={2} className={inputCls} />
            </div>
          </div>

          {/* Demographics */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Demographic Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input required type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <input required value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Age *</label>
                <input required type="number" value={form.age} onChange={(e) => set("age", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Do you need any accommodations when volunteering?</label>
              <textarea value={form.accommodations} onChange={(e) => set("accommodations", e.target.value)} rows={2} className={inputCls} placeholder="e.g. sitting position, no heavy lifting" />
            </div>
          </div>

          {/* Profile */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
            <div>
              <label className={labelCls}>T-Shirt Size</label>
              <select value={form.tshirt_size} onChange={(e) => set("tshirt_size", e.target.value)} className={inputCls}>
                <option value="">Select size</option>
                {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Dietary Restrictions</label>
              <div className="flex flex-wrap gap-3">
                {DIETARY.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.dietary_restrictions.includes(d)} onChange={() => set("dietary_restrictions", toggle(form.dietary_restrictions, d))} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.photo_release} onChange={(e) => set("photo_release", e.target.checked)} />
                Photo Release — I consent to being photographed during volunteer activities
              </label>
            </div>
          </div>

          {/* Interests */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.interests.includes(i)} onChange={() => set("interests", toggle(form.interests, i))} />
                  {i}
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {SKILLS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.skills.includes(s)} onChange={() => set("skills", toggle(form.skills, s))} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Opportunities</h2>
            <div className="flex flex-wrap gap-3">
              {OPPORTUNITIES.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.opportunities.includes(o)} onChange={() => set("opportunities", toggle(form.opportunities, o))} />
                  {o}
                </label>
              ))}
            </div>
            <div>
              <label className={labelCls}>Are there any specific positions you are interested in?</label>
              <textarea value={form.specific_positions} onChange={(e) => set("specific_positions", e.target.value)} rows={2} className={inputCls} />
            </div>
          </div>

          {/* Message Preference */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Message Preference</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.text_opt_in} onChange={(e) => set("text_opt_in", e.target.checked)} />
              I would like to opt-in to text messaging
            </label>
            <div>
              <label className={labelCls}>What kinds of emails would you like to receive?</label>
              <div className="flex flex-wrap gap-3">
                {EMAIL_PREFS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.email_preferences.includes(p)} onChange={() => set("email_preferences", toggle(form.email_preferences, p))} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Agreement */}
          <div className={sectionCls}>
            <h2 className="text-lg font-semibold text-gray-800">Volunteer Program Application</h2>
            <p className="text-sm text-gray-600">I agree that I am:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Able to maintain a consistent presence at Science Museum Oklahoma.</li>
              <li>At least 18 years of age.</li>
              <li>Able to go through our application and orientation process (application, interview, and background check).</li>
              <li>Able to attend onboarding and training.</li>
              <li>Ready to be helpful, passionate about science, and ready to serve!</li>
              <li>Able to commit to one three-hour shift weekly for a minimum of 12 weeks, or one monthly event for a minimum of 6 months.</li>
            </ul>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.agree} onChange={(e) => set("agree", e.target.checked)} />
              I agree to the above terms and adopt this as my signature *
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#1f4f99] py-3 text-base font-semibold text-white hover:bg-[#1a4280] disabled:opacity-50 transition"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
