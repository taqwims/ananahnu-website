package domain

type CMSRepository interface {
	FindAllNews(filter map[string]interface{}) ([]News, error)
	CreateNews(news *News) error
	UpdateNews(news *News) error
	DeleteNews(id int64) error

	FindContentBlock(key string) (*ContentBlock, error)
	UpdateContentBlock(block *ContentBlock) error

	// Add Affiliates and Products later
}
