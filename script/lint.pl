use strict;
use warnings;
use JSON;
use Perl::Lint;

my ($config_file_path_wo_ext, $target_file) = @ARGV;

my $json;
foreach my $ext (qw/.json/) {
    open my $fh, '<', $config_file_path_wo_ext.$ext or next;
    $json = do { local $/; <$fh> };
    close $fh;
}

my $opts = $json ? decode_json($json) : +{};

my $violations = Perl::Lint->new($opts)->lint([$target_file]);
print encode_json($violations);
