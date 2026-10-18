package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.VectorDarkTeal
import com.example.ui.theme.VectorMustardYellow
import com.example.ui.theme.VectorPrimaryTeal
import com.example.ui.theme.VectorSoftGreen

data class OnboardingStep(
    val badge: String,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val featureCards: List<FeatureItem>
)

data class FeatureItem(
    val icon: ImageVector,
    val title: String,
    val description: String
)

@Composable
fun OnboardingScreen(
    onFinishOnboarding: () -> Unit,
    modifier: Modifier = Modifier
) {
    val steps = remember {
        listOf(
            OnboardingStep(
                badge = "WELCOME TO VECTOR",
                title = "Secure Cloud Infrastructure Prompts",
                subtitle = "Vector analyses natural-language AWS prompts before infrastructure code is generated, finding missing security controls and critical misconfigurations.",
                icon = Icons.Default.Security,
                featureCards = listOf(
                    FeatureItem(
                        icon = Icons.Default.Analytics,
                        title = "Pre-Generation Diagnosis",
                        description = "Intercept security gaps before Terraform, CDK, or CloudFormation templates are generated."
                    ),
                    FeatureItem(
                        icon = Icons.Default.Shield,
                        title = "Zero Deployment Risk",
                        description = "Analyzes your architectural prompt intent safely without connecting to live AWS credentials."
                    ),
                    FeatureItem(
                        icon = Icons.Default.CloudDone,
                        title = "Offline By Design",
                        description = "Core rule-based NLP security scanner runs 100% on-device with no external API dependency."
                    )
                )
            ),
            OnboardingStep(
                badge = "THE 3-STEP WORKFLOW",
                title = "Analyze • Review • Improve",
                subtitle = "Hardening your cloud infrastructure prompts takes just three seamless steps.",
                icon = Icons.Default.Tune,
                featureCards = listOf(
                    FeatureItem(
                        icon = Icons.Default.Analytics,
                        title = "1. Enter AWS Prompt",
                        description = "Describe your architecture (EC2, S3, RDS, ALB, VPC) or choose from ready-to-test examples."
                    ),
                    FeatureItem(
                        icon = Icons.Default.Security,
                        title = "2. Review Findings",
                        description = "Inspect your Risk Score, Security Coverage, and categorized Missing Controls vs Risky Statements."
                    ),
                    FeatureItem(
                        icon = Icons.Default.ContentCopy,
                        title = "3. Add Security Clauses",
                        description = "Select recommended fixes to automatically append hardened security requirement clauses."
                    )
                )
            ),
            OnboardingStep(
                badge = "INTELLIGENT DIAGNOSIS",
                title = "History, Metrics & Re-Analysis",
                subtitle = "Track your security improvements over time and verify prompt hardening with instantaneous re-scanning.",
                icon = Icons.Default.History,
                featureCards = listOf(
                    FeatureItem(
                        icon = Icons.Default.History,
                        title = "Audit History & Search",
                        description = "Browse past analyses, filter by risk severity (Critical, High, Medium, Low), or reopen results."
                    ),
                    FeatureItem(
                        icon = Icons.Default.CheckCircle,
                        title = "Re-analyze Hardened Prompts",
                        description = "Submit your improved prompt with security clauses and watch your risk score drop from 90+ down to low risk."
                    ),
                    FeatureItem(
                        icon = Icons.Default.Lock,
                        title = "One-Click Clipboard Export",
                        description = "Copy your fully hardened prompt directly into your AI generator or infrastructure tooling."
                    )
                )
            ),
            OnboardingStep(
                badge = "READY TO START",
                title = "Safeguard Your Cloud Today",
                subtitle = "You are all set to evaluate your AWS prompts and prevent costly cloud data exposures.",
                icon = Icons.Default.RocketLaunch,
                featureCards = listOf(
                    FeatureItem(
                        icon = Icons.Default.VerifiedUser,
                        title = "Offline Rule Engine Active",
                        description = "Your local rule-based analysis engine is primed and ready to evaluate prompts anytime."
                    ),
                    FeatureItem(
                        icon = Icons.Default.Tune,
                        title = "Revisit Anytime",
                        description = "You can access this guide, explore sample data, or toggle dark mode anytime in Settings."
                    )
                )
            )
        )
    }

    var currentStepIndex by remember { mutableIntStateOf(0) }
    val currentStep = steps[currentStepIndex]
    val isLastStep = currentStepIndex == steps.size - 1
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Bar with Skip Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(VectorPrimaryTeal)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "VECTOR",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            letterSpacing = 1.sp
                        )
                    )
                }
            }

            if (!isLastStep) {
                TextButton(
                    onClick = onFinishOnboarding,
                    modifier = Modifier.testTag("onboarding_skip_button")
                ) {
                    Text(
                        text = "Skip",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            } else {
                Spacer(modifier = Modifier.width(48.dp))
            }
        }

        // Center Scrollable Content
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(scrollState)
                .padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Step Badge
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = VectorDarkTeal,
                border = BorderStroke(1.dp, VectorMustardYellow.copy(alpha = 0.4f))
            ) {
                Text(
                    text = currentStep.badge,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = VectorMustardYellow,
                        letterSpacing = 1.sp
                    ),
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Hero Icon in Circular Container
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = currentStep.icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(42.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Title
            Text(
                text = currentStep.title,
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                ),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Subtitle
            Text(
                text = currentStep.subtitle,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 22.sp
                ),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 12.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Feature Highlights Cards
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                currentStep.featureCards.forEach { card ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = card.icon,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = card.title,
                                    style = MaterialTheme.typography.titleSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = card.description,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        lineHeight = 18.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }

        // Bottom Controls: Step Indicator & Next / Get Started Buttons
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Step Dots
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                steps.indices.forEach { index ->
                    val isCurrent = index == currentStepIndex
                    Box(
                        modifier = Modifier
                            .height(8.dp)
                            .width(if (isCurrent) 24.dp else 8.dp)
                            .clip(CircleShape)
                            .background(
                                if (isCurrent) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                            )
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Action Buttons
            if (isLastStep) {
                Button(
                    onClick = onFinishOnboarding,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("onboarding_get_started_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = VectorMustardYellow,
                        contentColor = VectorDarkTeal
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.RocketLaunch,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Get Started & Go to Home",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    )
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (currentStepIndex > 0) {
                        OutlinedButton(
                            onClick = { currentStepIndex-- },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .testTag("onboarding_previous_button"),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Text(
                                text = "Previous",
                                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
                            )
                        }
                    }

                    Button(
                        onClick = { currentStepIndex++ },
                        modifier = Modifier
                            .weight(if (currentStepIndex > 0) 1.5f else 1f)
                            .height(50.dp)
                            .testTag("onboarding_next_button"),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = Color.White
                        )
                    ) {
                        Text(
                            text = "Next",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}
