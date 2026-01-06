"use client";

import { Box, Flex, Grid, Heading, Text, Button, Card, Section } from "@radix-ui/themes";

export default function DesignSystemPage() {
    return (
        <Box className="min-h-screen bg-[var(--color-background)] p-8">
            <Section size="2">
                <Flex direction="column" gap="8">

                    <Box>
                        <Heading size="8" mb="4">Design System Verification</Heading>
                        <Text size="3" color="gray">
                            Verifying custom "Earthy" (Primary) and "Blue" (Secondary) palettes.
                        </Text>
                    </Box>

                    {/* COLOR PALETTES */}
                    <Grid columns="2" gap="8">
                        <Card>
                            <Heading size="4" mb="4">Primary Accent (Lila Earth / Red)</Heading>
                            <Flex wrap="wrap" gap="2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((step) => (
                                    <Flex key={step} direction="column" align="center" gap="1">
                                        <Box
                                            width="40px"
                                            height="40px"
                                            style={{ backgroundColor: `var(--red-${step})` }}
                                            className="rounded-md border border-[var(--gray-5)]"
                                        />
                                        <Text size="1" color="gray">{step}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                            <Box mt="4">
                                <Button color="red">Primary Button</Button>
                                <Button color="red" variant="soft" ml="2">Soft</Button>
                                <Button color="red" variant="outline" ml="2">Outline</Button>
                            </Box>
                        </Card>

                        <Card>
                            <Heading size="4" mb="4">Secondary Accent (Blue)</Heading>
                            <Flex wrap="wrap" gap="2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((step) => (
                                    <Flex key={step} direction="column" align="center" gap="1">
                                        <Box
                                            width="40px"
                                            height="40px"
                                            style={{ backgroundColor: `var(--blue-${step})` }}
                                            className="rounded-md border border-[var(--gray-5)]"
                                        />
                                        <Text size="1" color="gray">{step}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                            <Box mt="4">
                                <Button color="blue">Secondary Button</Button>
                                <Button color="blue" variant="soft" ml="2">Soft</Button>
                                <Button color="blue" variant="outline" ml="2">Outline</Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* TYPOGRAPHY & SCALING */}
                    <Card>
                        <Heading size="6" mb="4">Typography: Custom 9-Step Scale</Heading>
                        <Grid columns="1" gap="6">
                            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((step) => (
                                <Flex key={step} direction="column" gap="1" className="border-b border-[var(--gray-3)] pb-4">
                                    <Flex align="baseline" gap="4">
                                        <Text size="1" color="gray" style={{ width: '40px' }}>Step {step}</Text>
                                        <Heading
                                            size={step.toString() as any}
                                            style={{ fontFamily: 'var(--font-playfair)' }}
                                        >
                                            Playfair Display Serif
                                        </Heading>
                                    </Flex>
                                    <Flex align="baseline" gap="4">
                                        <Box style={{ width: '40px' }} />
                                        <Text size={step.toString() as any} weight="regular">
                                            San Francisco Pro Sans Serif
                                        </Text>
                                    </Flex>
                                    <Flex align="center" gap="4" mt="1">
                                        <Box style={{ width: '40px' }} />
                                        <Text size="1" color="gray">
                                            Size: {step === 1 ? '12px' : step === 2 ? '14px' : step === 3 ? '16px' : step === 4 ? '18px' : step === 5 ? '20px' : step === 6 ? '24px' : step === 7 ? '28px' : step === 8 ? '35px' : '60px'} |
                                            Spacing: {step === 1 ? '0.0025em' : step >= 4 ? [-0.0025, -0.005, -0.00625, -0.0075, -0.01, -0.025][step - 4] + 'em' : '0em'}
                                        </Text>
                                    </Flex>
                                </Flex>
                            ))}
                        </Grid>

                        <Box mt="8">
                            <Heading size="4" mb="4">Weights</Heading>
                            <Flex direction="column" gap="2">
                                <Text weight="light" size="5">Light (300)</Text>
                                <Text weight="regular" size="5">Regular (400)</Text>
                                <Text weight="medium" size="5">Medium (500)</Text>
                                <Text weight="bold" size="5">Bold (700)</Text>
                            </Flex>
                        </Box>
                    </Card>

                </Flex>
            </Section>
        </Box>
    );
}
