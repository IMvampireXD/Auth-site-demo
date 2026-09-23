const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const client = supabase.createClient(
NOVA_CONFIG.url,
NOVA_CONFIG.anonKey
);

const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const successPanel = $("#successPanel");

const otpPanel = $("#otpPanel");
const otpForm = $("#otpForm");
const otpCode = $("#otpCode");
const otpEmail = $("#otpEmail");
const otpError = $("#otpError");
const resendOtp = $("#resendOtp");
const backToRegister = $("#backToRegister");

let pendingRegistrationEmail = "";
const countryField = $("#countryField"); const countryTrigger = $("#countryTrigger"); const countryMenu = $("#countryMenu"); const countrySearch = $("#countrySearch"); const countryInput = $("#country"); const countryValue = countryField?.querySelector(".country-value"); const countryOptions = [...document.querySelectorAll(".country-option")]; function openCountryMenu() { if (!countryField) return; countryField.classList.add("open"); countryTrigger.setAttribute("aria-expanded", "true"); setTimeout(() => { countrySearch?.focus(); }, 80); } function closeCountryMenu() { if (!countryField) return; countryField.classList.remove("open"); countryTrigger.setAttribute("aria-expanded", "false"); } function selectCountry(button) { const value = button.dataset.value; countryInput.value = value; countryValue.textContent = button.textContent; countryField.classList.add("has-value"); countryOptions.forEach(option => { option.classList.toggle("selected", option === button); }); countrySearch.value = ""; countryOptions.forEach(option => { option.style.display = ""; }); closeCountryMenu(); } countryTrigger?.addEventListener("click", () => { if (countryField.classList.contains("open")) { closeCountryMenu(); } else { openCountryMenu(); } }); countryOptions.forEach(option => { option.addEventListener("click", () => { selectCountry(option); }); }); countrySearch?.addEventListener("input", () => { const query = countrySearch.value.trim().toLowerCase(); let visible = 0; countryOptions.forEach(option => { const matches = option.textContent.toLowerCase().includes(query); option.style.display = matches ? "" : "none"; if (matches) visible++; }); let empty = countryMenu.querySelector(".country-empty"); if (!visible) { if (!empty) { empty = document.createElement("div"); empty.className = "country-empty"; empty.textContent = "No country found."; countryMenu.querySelector(".country-options").appendChild(empty); } } else { empty?.remove(); } }); document.addEventListener("click", event => { if ( countryField && !countryField.contains(event.target) ) { closeCountryMenu(); } }); document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCountryMenu(); } });
function configured() {
return (
NOVA_CONFIG.url.startsWith("http") &&
!NOVA_CONFIG.anonKey.startsWith("YOUR_")
);
}

function showPage(page) {
successPanel.classList.remove("show");

loginForm.classList.toggle("active", page === "login");
registerForm.classList.toggle("active", page === "register");

$$(".tab").forEach(button => {
  button.classList.toggle(
    "active",
    button.dataset.page === page
  );
});

window.scrollTo({
  top: 0,
  behavior: "smooth"
});
}


$$("[data-page]").forEach(button => {
button.addEventListener("click", () => {
  showPage(button.dataset.page);
});
});


$$(".eye").forEach(button => {
button.addEventListener("click", () => {
  const input = $("#" + button.dataset.target);

  input.type =
    input.type === "password"
      ? "text"
      : "password";

  button.textContent =
    input.type === "password"
      ? "◉"
      : "◌";
});
});


function setBad(input, messageEl, message) {
input.closest(".field")?.classList.toggle(
  "bad",
  !!message
);

messageEl.textContent = message || "";
}


function updateRules() {
const password = $("#registerPassword").value;
const confirm = $("#confirmPassword").value;

const rules = {
  length: password.length >= 8,
  number: /[0-9]/.test(password),
  space: password.length > 0 && !/\s/.test(password)
};

Object.entries(rules).forEach(([rule, valid]) => {
  const element = document.querySelector(
    `[data-rule="${rule}"]`
  );

  if (element) {
    element.classList.toggle("valid", valid);
  }
});

const hint = $("#matchHint");

if (!confirm) {
  hint.textContent = "";
  hint.style.color = "";
  return;
}

if (password === confirm) {
  hint.textContent = "Passwords match.";
  hint.style.color = "#159570";
} else {
  hint.textContent = "Passwords do not match.";
  hint.style.color = "#e5484d";
}
}


function validPassword(password) {
return (
  password.length >= 8 &&
  /[0-9]/.test(password) &&
  !/\s/.test(password)
);
}


function shake(form) {
form.classList.remove("shake");

void form.offsetWidth;

form.classList.add("shake");
}


function errorText(error) {
const message = error?.message || "";

if (/already registered|already exists|unique/i.test(message)) {
  return "That name or email is already in use.";
}

return message || "Something went wrong. Please try again.";
}


$("#registerPassword").addEventListener(
"input",
updateRules
);

$("#confirmPassword").addEventListener(
"input",
updateRules
);


$("#name").addEventListener("input", () => {
setBad(
  $("#name"),
  $("#nameHint"),
  ""
);
});


$("#email").addEventListener("input", () => {
setBad(
  $("#email"),
  $("#emailHint"),
  ""
);
});

function showOtpPanel(email) {
  pendingRegistrationEmail = email;

  otpEmail.textContent = email;

  registerForm.classList.remove("active");
  loginForm.classList.remove("active");
  successPanel.classList.remove("show");

  otpPanel.classList.add("active");

  otpCode.value = "";
  otpError.textContent = "";

  setTimeout(() => {
    otpCode.focus();
  }, 100);
}


function hideOtpPanel() {
  otpPanel.classList.remove("active");
}


otpForm.addEventListener("submit", async e => {
  e.preventDefault();

  otpError.textContent = "";

  const code = otpCode.value.trim();

  if (!/^\d{6}$/.test(code)) {
    otpError.textContent =
      "Enter the 6-digit verification code.";

    shake(otpForm);
    return;
  }

  const {
    data,
    error
  } = await client.auth.verifyOtp({
    email: pendingRegistrationEmail,
    token: code,
    type: "signup"
  });

  if (error) {
    console.error("OTP verification error:", error);

    otpError.textContent =
      "Invalid or expired verification code.";

    shake(otpForm);
    return;
  }

  if (!data.session) {
    otpError.textContent =
      "Email verified. Please sign in.";

    setTimeout(() => {
      hideOtpPanel();
      showPage("login");
    }, 1000);

    return;
  }

  await client.auth.signOut();

  hideOtpPanel();

  successPanel.classList.add("show");

  setTimeout(() => {
    showPage("login");
  }, 1700);
});


resendOtp.addEventListener("click", async () => {
  if (!pendingRegistrationEmail) return;

  otpError.textContent = "";

  resendOtp.disabled = true;
  resendOtp.textContent = "Sending...";

  const { error } = await client.auth.resend({
    type: "signup",
    email: pendingRegistrationEmail
  });

  if (error) {
    console.error("Resend OTP error:", error);

    otpError.textContent =
      "Could not resend the code. Please try again later.";
  } else {
    otpError.textContent =
      "A new verification code was sent.";

    otpError.style.color = "#159570";
  }

  setTimeout(() => {
    resendOtp.disabled = false;
    resendOtp.textContent = "Resend code";
  }, 3000);
});


backToRegister.addEventListener("click", () => {
  hideOtpPanel();
  showPage("register");
});

registerForm.addEventListener("submit", async e => {
e.preventDefault();

$("#registerError").textContent = "";

if (!configured()) {
  $("#registerError").textContent =
    "Add your Supabase URL and anon key in config.js first.";

  shake(registerForm);
  return;
}

const data = Object.fromEntries(
  new FormData(registerForm)
);

const name = data.name.trim();
const email = data.email.trim().toLowerCase();
const country = data.country?.trim();


if (!name || !country || !email) {
  $("#registerError").textContent =
    "Please fill in all fields.";

  shake(registerForm);
  return;
}


const {
  data: available,
  error: nameCheckError
} = await client.rpc(
  "is_name_available",
  {
    p_name: name
  }
);


if (nameCheckError) {
  console.error(
    "Name availability error:",
    nameCheckError
  );

  $("#registerError").textContent =
    "Could not verify the name right now. Please try again.";

  shake(registerForm);
  return;
}


if (!available) {
  setBad(
    $("#name"),
    $("#nameHint"),
    "That name is already taken."
  );

  $("#registerError").textContent =
    "Please choose a different name.";

  shake(registerForm);
  return;
}


if (!validPassword(data.password)) {
  $("#registerError").textContent =
    "Password must be at least 8 characters, contain 1 number, and have no spaces.";

  shake(registerForm);
  return;
}


if (data.password !== data.confirmPassword) {
  setBad(
    $("#confirmPassword"),
    $("#matchHint"),
    "Passwords do not match."
  );

  shake(registerForm);
  return;
}


const {
  data: signup,
  error
} = await client.auth.signUp({
  email,
  password: data.password,

  options: {
    data: {
      name,
      country
    }
  }
});


if (error) {
  const message = errorText(error);

  $("#registerError").textContent = message;

  if (/name/i.test(message)) {
    setBad(
      $("#name"),
      $("#nameHint"),
      message
    );
  }

  if (/email/i.test(message)) {
    setBad(
      $("#email"),
      $("#emailHint"),
      message
    );
  }

  shake(registerForm);
  return;
}

if (!signup.session) {
  registerForm.reset();
  updateRules();

  showOtpPanel(email);

  return;
}

await client.auth.signOut();

successPanel.classList.add("show");

registerForm.classList.remove("active");

setTimeout(() => {
  showPage("login");
}, 1700);
});


loginForm.addEventListener("submit", async e => {
e.preventDefault();

$("#loginError").textContent = "";

if (!configured()) {
  $("#loginError").textContent =
    "Add your Supabase URL and anon key in config.js first.";

  shake(loginForm);
  return;
}


const data = Object.fromEntries(
  new FormData(loginForm)
);

let identifier = data.identifier.trim();


if (!identifier.includes("@")) {

  const {
    data: fn,
    error
  } = await client.functions.invoke(
    "login-by-name",
    {
      body: {
        name: identifier,
        password: data.password
      }
    }
  );


  if (error || !fn?.access_token) {
    $("#loginError").textContent =
      "Incorrect name or password.";

    $("#loginPassword")
      .closest(".field")
      .classList.add("bad");

    shake(loginForm);

    return;
  }


  const {
    error: sessionError
  } = await client.auth.setSession({
    access_token: fn.access_token,
    refresh_token: fn.refresh_token
  });


  if (sessionError) {
    $("#loginError").textContent =
      "Could not create a session. Please try again.";

    shake(loginForm);

    return;
  }


  location.href = "account.html";

  return;
}


const { error } =
  await client.auth.signInWithPassword({
    email: identifier,
    password: data.password
  });


if (error) {
  $("#loginError").textContent =
    "Incorrect password or email.";

  $("#loginPassword")
    .closest(".field")
    .classList.add("bad");

  shake(loginForm);

  return;
}


location.href = "account.html";
});

