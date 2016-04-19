# linter-perl-lint package

Lint perl codes by [Perl::Lint](https://github.com/moznion/Perl-Lint/blob/master/lib/Perl/Lint.pm),
which is a faster implementation of [Perl::Critic](https://github.com/Perl-Critic/Perl-Critic).

## Perl::Lint Settings

We can control which policies are used by `.perllintrc.json`,
whose basename can be changed via `linter-perl-lint.perlLintConfigFileBasename`.

The object decoded the file will be passed to `Perl::Lint->new(HERE)` directly.

Unfortunately, the severity/theme in Perl::Critic are not available because they have not been supported yet in Perl::Lint.
