import { Component, OnInit, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.form.get("email")!;
  }

  get password() {
    return this.form.get("password")!;
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.redirectAfterLogin(true);
      return;
    }

    const token = this.route.snapshot.queryParamMap.get("token");
    const error = this.route.snapshot.queryParamMap.get("error");
    const email = this.route.snapshot.queryParamMap.get("email");
    const verified = this.route.snapshot.queryParamMap.get("verified");

    if (token) {
      this.auth.applySession({ token });

      this.auth.ensureCurrentUserLoaded().subscribe({
        next: () => {
          this.toast.success("Login successful!");
          this.auth.redirectAfterLogin(true);
        },
        error: () => {
          this.toast.error("Login Failed", "Unable to restore your session.");
          this.auth.clearSession();
          this.router.navigate(["/auth/login"], { replaceUrl: true });
        },
      });
      return;
    }

    if (error) {
      this.toast.error("Login Failed", error);
    }

    if (email) {
      this.form.patchValue({ email });
    }

    if (verified === "1") {
      this.toast.success(
        "Email verified successfully!",
        "You can sign in now.",
      );
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.auth
      .login({
        email: this.email.value!,
        password: this.password.value!,
      })
      .subscribe({
        next: () => {
          this.auth.ensureCurrentUserLoaded().subscribe({
            next: () => {
              this.loading.set(false);
              this.toast.success("Welcome back!");
              this.auth.redirectAfterLogin(true);
            },
            error: () => {
              this.loading.set(false);
              this.toast.error("Login Failed", "Unable to load user session.");
            },
          });
        },
        error: (err) => {
          this.loading.set(false);

          const msg =
            err?.error?.message ?? "Invalid credentials. Please try again.";

          if (msg.toLowerCase().includes("not verified")) {
            this.toast.warning(
              "Account not verified",
              "Redirecting to verification page...",
            );
            this.router.navigate(["/auth/verify-email-otp"], {
              queryParams: { email: this.email.value },
            });
            return;
          }

          this.toast.error("Login failed", msg);
        },
      });
  }

  loginWithGoogle(): void {
    window.location.assign(this.auth.getGoogleLoginUrl());
  }
}
