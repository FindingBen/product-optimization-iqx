class ProductAnalyzer {
  constructor(product, rules) {
    this.product = product;
    this.rules = rules;
  }

  analyzeTitle() {
    const { title } = this.product;
    const { minTitleLength, maxTitleLength } = this.rules;

    const result = {
      seoDelta: 0,
      completenessDelta: 0,
      issues: [],
      meta: { titleLength: title?.length || 0 }
    };

    if (!title) {
      result.issues.push({
        code: "TITLE_MISSING",
        severity: "error",
        message: "Product title is missing"
      });
      return result;
    }

    result.seoDelta += 15;
    result.completenessDelta += 15;

    if (
      title.length < minTitleLength ||
      title.length > maxTitleLength
    ) {
      result.issues.push({
        code: "TITLE_LENGTH_INVALID",
        severity: "warning",
        message: `Title length must be between ${minTitleLength} and ${maxTitleLength}`
      });
    } else {
      result.seoDelta += 15;
    }

    return result;
  }

  analyzeDescription() {
    const { description } = this.product;
    const { minDescriptionLength, maxDescriptionLength } = this.rules;

    const result = {
      seoDelta: 0,
      completenessDelta: 0,
      issues: [],
      meta: { descriptionLength: description?.length || 0 }
    };

    if (!description) {
      result.issues.push({
        code: "DESCRIPTION_MISSING",
        severity: "error",
        message: "Product description is missing"
      });
      return result;
    }

    result.seoDelta += 15;
    result.completenessDelta += 15;

    if (
      description.length < minDescriptionLength ||
      description.length > maxDescriptionLength
    ) {
      result.issues.push({
        code: "DESCRIPTION_LENGTH_INVALID",
        severity: "warning",
        message: `Description length must be between ${minDescriptionLength} and ${maxDescriptionLength}`
      });
    } else {
      result.seoDelta += 15;
    }

    return result;
  }

  analyzeImages() {
    const { parentImages = [], variantImages = [] } = this.product;
    return ProductAnalyzer.analyzeImages(parentImages, variantImages, this.rules);
  }

  analyze() {
    const finalResult = new AnalysisResult(this.product.id);

    const checks = [
      this.analyzeTitle(),
      this.analyzeDescription()
    ];

    for (const check of checks) {
      finalResult.addScore(check.seoDelta, check.completenessDelta);
      check.issues.forEach(issue =>
        finalResult.addIssue(issue.code, issue.message, issue.severity)
      );

      Object.entries(check.meta).forEach(([k, v]) =>
        finalResult.addMeta(k, v)
      );
    }

    const imageResult = this.analyzeImages();
    finalResult.addScore(
      imageResult.seo_score,
      imageResult.completeness
    );

    return finalResult;
  }
}